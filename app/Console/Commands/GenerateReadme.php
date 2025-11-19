<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GenerateReadme extends Command
{
    /**
     * Nom de la commande.
     */
    protected $signature = 'app:generate-readme {--force : Écrase README.md s\'il existe}';

    /**
     * Description de la commande.
     */
    protected $description = 'Génère automatiquement un README.md (extraits de docblocks, controllers, models, frontend)';

    /**
     * Méthode principale.
     */
    public function handle()
    {
        $path = base_path('README.md');

        if (File::exists($path) && ! $this->option('force')) {
            $this->error('README.md existe déjà. Utilisez --force pour l\'écraser.');
            return 1;
        }

        // Informations générales
        $appName = config('app.name') ?: env('APP_NAME', 'LaravelApp');
        $date = date('Y-m-d H:i:s');
        $php = phpversion();

        // Récupérations "best-effort"
        $composer = $this->getComposerPackages();
        $frontend = $this->getFrontendFilesDoc();
        $routesTable = $this->getRoutesInfoTable();
        $controllers = $this->getControllersDoc();
        $models = $this->getModelsDoc();
        $frontendFiles = $this->getFrontendFilesDoc();
        $dbSchema = $this->getDatabaseSchema(); // silencieux si DB non-config
        $git = $this->getGitInfo();

        // Construit README
        $content = $this->buildReadme($appName, $date, $php, $composer, $frontend, $routesTable, $controllers, $models, $frontendFiles, $dbSchema, $git);

        try {
            File::put($path, $content);
            $this->info("README.md généré avec succès : {$path}");
            return 0;
        } catch (\Exception $e) {
            $this->error('Erreur lors de la création du README: ' . $e->getMessage());
            return 1;
        }
    }

    /* -------------------- Extraire composer.json -------------------- */
    protected function getComposerPackages(): string
    {
        $composerPath = base_path('composer.json');
        if (!File::exists($composerPath)) {
            return '- composer.json introuvable';
        }

        try {
            $composer = json_decode(File::get($composerPath), true);
            $require = $composer['require'] ?? [];
            unset($require['php']);
            $lines = [];
            foreach ($require as $pkg => $ver) {
                $lines[] = "- {$pkg}: `{$ver}`";
            }
            return implode(PHP_EOL, $lines) ?: '- Aucune dépendance listée';
        } catch (\Throwable $e) {
            return '- Impossible de lire composer.json';
        }
    }

    /* -------------------- Routes sous forme de tableau Markdown -------------------- */
    protected function getRoutesInfoTable(): string
    {
        try {
            $routes = collect(Route::getRoutes())->map(function ($r) {
                return [
                    'methods' => implode('|', $r->methods()),
                    'uri' => $r->uri(),
                    'action' => $r->getActionName(),
                ];
            })->unique('uri')->values();

            if ($routes->isEmpty()) {
                return '*Aucune route détectée.*';
            }

            $header = "| Méthodes | URI | Action |\n|---------|-----|--------|";
            $rows = $routes->map(fn($r) => "| {$r['methods']} | {$r['uri']} | `{$r['action']}` |");

            return $header . "\n" . $rows->implode("\n");
        } catch (\Throwable $e) {
            return '- Impossible de lister les routes: ' . $e->getMessage();
        }
    }

    /* -------------------- Controllers : extraire docblocks (résumé) et méthodes -------------------- */
    protected function getControllersDoc(): string
    {
        $dir = app_path('Http/Controllers');
        if (!is_dir($dir)) return '- Dossier Controllers introuvable';

        $files = $this->allPhpFiles($dir);
        $out = [];

        foreach ($files as $file) {
            $src = File::get($file);
            $className = $this->extractClassName($src);
            $ns = $this->extractNamespace($src);
            if (!$className) continue;
            $fqcn = $ns ? "{$ns}\\{$className}" : $className;

            // inclure si non autoloaded (best-effort)
            if (!class_exists($fqcn)) {
                try { require_once $file; } catch (\Throwable $e) {}
            }
            if (!class_exists($fqcn)) continue;

            try {
                $ref = new \ReflectionClass($fqcn);
                // résumé depuis docblock de la classe
                $summary = $this->extractClassDocSummary($src) ?? 'Pas de résumé (docblock manquant).';
                // méthodes publiques définies dans la classe
                $methods = array_filter($ref->getMethods(\ReflectionMethod::IS_PUBLIC), fn($m) => $m->class === $fqcn);
                $methodSummaries = [];
                foreach ($methods as $m) {
                    if (in_array($m->name, ['__construct', '__destruct'])) continue;
                    $mDoc = $this->extractMethodDocSummary($m);
                    $methodSummaries[] = "- `{$m->name}()` — " . ($mDoc ?? 'pas de doc');
                }
                $out[] = "### {$fqcn}\n\n" . $summary . "\n\n" . (count($methodSummaries) ? implode("\n", $methodSummaries) : "- Aucune méthode publique documentée.") . "\n";
            } catch (\Throwable $e) {
                $out[] = "- {$fqcn} : impossible d'inspecter ({$e->getMessage()})";
            }
        }

        return implode(PHP_EOL . PHP_EOL, $out) ?: '- Aucun controller détecté';
    }

    /* -------------------- Models : docblocks + fillable/table -------------------- */
    protected function getModelsDoc(): string
    {
        $dir = app_path('Models');
        if (!is_dir($dir)) $dir = app_path();

        $files = $this->allPhpFiles($dir);
        $out = [];

        foreach ($files as $file) {
            $src = File::get($file);
            $className = $this->extractClassName($src);
            $ns = $this->extractNamespace($src);
            if (!$className) continue;
            $fqcn = $ns ? "{$ns}\\{$className}" : $className;

            if (!class_exists($fqcn)) {
                try { require_once $file; } catch (\Throwable $e) {}
            }
            if (!class_exists($fqcn)) continue;

            try {
                $ref = new \ReflectionClass($fqcn);
                if (!$ref->isSubclassOf(\Illuminate\Database\Eloquent\Model::class)) continue;

                $summary = $this->extractClassDocSummary($src) ?? 'Pas de résumé (docblock manquant).';
                $dp = $ref->getDefaultProperties();
                $fillable = $dp['fillable'] ?? [];
                $table = $dp['table'] ?? Str::snake(Str::pluralStudly($className));

                $out[] = "### {$fqcn}\n\n{$summary}\n\n- Table (estimée): `{$table}`\n- Fillable: `" . (is_array($fillable) ? implode('`, `', $fillable) : '') . "`\n";
            } catch (\Throwable $e) {
                $out[] = "- {$fqcn} : impossible d'inspecter ({$e->getMessage()})";
            }
        }

        return implode(PHP_EOL . PHP_EOL, $out) ?: '- Aucun modèle Eloquent détecté';
    }

    /* -------------------- Frontend: lister fichiers React et extraire résumé en tête -------------------- */
    protected function getFrontendFilesDoc(): string
    {
        $dir = base_path('resources/js');
        if (!is_dir($dir)) return '- Dossier frontend resources/js introuvable';

        $ext = ['js','jsx','ts','tsx'];
        $rii = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));
        $rows = [];
        foreach ($rii as $file) {
            if ($file->isDir()) continue;
            if (!in_array($file->getExtension(), $ext)) continue;
            $rel = Str::replaceFirst(base_path() . DIRECTORY_SEPARATOR, '', $file->getPathname());
            $summary = $this->extractJsDocSummary($file->getPathname()) ?? 'À compléter manuellement';
            $rows[] = "| `{$rel}` | {$summary} |";
        }

        if (empty($rows)) return '- Aucun fichier frontend trouvé dans resources/js';

        $table = "| Fichier | Description |\n|--------|-------------|\n" . implode("\n", $rows);
        return $table;
    }

    /* -------------------- Optionnel : schéma DB (MySQL) -------------------- */
    protected function getDatabaseSchema(): string
    {
        try {
            // Teste la connexion DB ; si non configurée, on attrape l'exception et on retourne message
            $pdo = DB::connection()->getPdo();
            $driver = DB::getDriverName();
            if ($driver !== 'mysql') {
                return "- Schéma DB : driver non-MYSQL détecté ({$driver}).";
            }

            $dbName = env('DB_DATABASE');
            $tables = DB::select("SHOW TABLES");
            if (empty($tables)) return "- Aucune table trouvée via la connexion DB.";

            $key = "Tables_in_{$dbName}";
            $out = "## Structure de la base de données\n\n";
            foreach ($tables as $t) {
                $table = $t->$key;
                $cols = DB::select("SHOW COLUMNS FROM `{$table}`");
                $out .= "### Table `{$table}`\n\n";
                $out .= "| Colonne | Type | Null | Clé | Défaut | Extra |\n|--------:|:-----|:----:|:---:|:------:|:-----|\n";
                foreach ($cols as $c) {
                    $out .= "| {$c->Field} | {$c->Type} | {$c->Null} | {$c->Key} | " . ($c->Default ?? 'NULL') . " | {$c->Extra} |\n";
                }
                $out .= "\n";
            }
            return $out;
        } catch (\Throwable $e) {
            // Si DB mal configurée, on ne casse pas la génération ; on renvoie une note.
            return "- Schéma DB : non inclus (vérifiez .env / connexion). Détail: {$e->getMessage()}";
        }
    }

    /* -------------------- Git dernier commit -------------------- */
    protected function getGitInfo(): string
    {
        try {
            $gitDir = base_path('.git');
            if (!is_dir($gitDir)) return '- Repo git non trouvé';
            $last = trim(shell_exec('git -C ' . base_path() . ' log -1 --pretty=format:"%h - %s (%ci)" 2>/dev/null'));
            if ($last) return "- Dernier commit: {$last}";
            return '- Impossible de lire info git';
        } catch (\Throwable $e) {
            return "- Erreur git: {$e->getMessage()}";
        }
    }

    /* -------------------- Construction du README -------------------- */
    protected function buildReadme($appName, $date, $php, $composer, $frontend, $routesTable, $controllers, $models, $frontendFiles, $dbSchema, $git)
    {
        $content = "# {$appName}\n\n";
        $content .= "**Généré automatiquement** le {$date}.\n\n";

        $content .= "## Description\nCourte description du projet (à adapter) : projet Laravel + React (frontend dans `resources/js`).\n\n";

        $content .= "## Installation rapide\n1. `composer install`\n2. `cp .env.example .env` et configurez `.env` (DB, APP_URL...)\n3. `php artisan key:generate`\n4. `php artisan migrate --seed` (si nécessaire)\n5. Frontend: `cd resources/js && npm install && npm run dev`\n\n";

        $content .= "## Environnement\n- PHP: `{$php}`\n\n";

        $content .= "## Dépendances backend (composer)\n{$composer}\n\n";

        $content .= "## Frontend (package.json / scripts)\n{$frontend}\n\n";

        $content .= "## Routes détectées\n{$routesTable}\n\n";

        $content .= "## Controllers (extraits et résumés)\n{$controllers}\n\n";

        $content .= "## Models (extraits et résumés)\n{$models}\n\n";

        $content .= "## Frontend - fichiers (liste automatique, complétez les descriptions)\n{$frontendFiles}\n\n";

        $content .= "## Fonctionnalités extraites (best-effort)\n- Les résumés ci-dessus sont extraits des docblocks des classes et commentaires en tête de fichiers.\n- Complétez les descriptions manquantes dans les docblocks pour améliorer la qualité du README.\n\n";

        $content .= $dbSchema . "\n\n";

        $content .= "## Git\n{$git}\n\n";

        $content .= "## Comment contribuer\n- Ouvrez une issue pour proposer des changements majeurs.\n- Respectez PSR-12 pour PHP, et le linter choisi pour le frontend.\n- Documentez vos nouvelles routes/controllers/models avec des docblocks.\n\n";

        $content .= "## Notes finales\n- Ce README est semi-automatique : complétez les sections 'À compléter' pour avoir une documentation complète.\n";

        return $content;
    }

    /* -------------------- Helpers -------------------- */

    // Récupère tous les fichiers PHP dans un répertoire de façon récursive
    protected function allPhpFiles($dir)
    {
        if (!is_dir($dir)) return [];
        $rii = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));
        $files = [];
        foreach ($rii as $file) {
            if ($file->isDir()) continue;
            if ($file->getExtension() === 'php') $files[] = $file->getPathname();
        }
        return $files;
    }

    // Extrait le namespace depuis le code source
    protected function extractNamespace($src)
    {
        if (preg_match('/namespace\s+([^;]+);/m', $src, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    // Extrait le nom de la classe depuis le code source
    protected function extractClassName($src)
    {
        if (preg_match('/class\s+([^{\s]+)/m', $src, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    // Extrait la première ligne utile du docblock d'une classe
    protected function extractClassDocSummary(string $src): ?string
    {
        if (preg_match('/\/\*\*(.*?)\*\//s', $src, $matches)) {
            $docblock = trim($matches[1]);
            $lines = preg_split('/\R/', $docblock);
            foreach ($lines as $line) {
                $line = trim($line);
                $line = preg_replace('/^\s*\*\s?/', '', $line);
                if ($line !== '') {
                    return trim($line);
                }
            }
        }
        return null;
    }

    // Extrait la première ligne du docblock d'une méthode via ReflectionMethod
    protected function extractMethodDocSummary(\ReflectionMethod $m): ?string
    {
        $doc = $m->getDocComment();
        if (! $doc) return null;
        $doc = preg_replace('/^\/\*\*|\*\/$/', '', $doc);
        $doc = preg_replace('/^\s*\*\s?/m', '', $doc);
        $lines = preg_split('/\R/', trim($doc));
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line !== '') return $line;
        }
        return null;
    }

    // Extrait un court résumé en tête d'un fichier JS/TS (/** */ ou // lines)
    protected function extractJsDocSummary(string $path): ?string
    {
        try {
            $content = File::get($path);
            // Cherche /** ... */ en tête
            if (preg_match('/^\s*\/\*\*(.*?)\*\//s', $content, $m)) {
                $doc = trim($m[1]);
                $doc = preg_replace('/^\s*\*\s?/m', '', $doc);
                $lines = preg_split('/\R/', trim($doc));
                foreach ($lines as $line) { if ($line = trim($line)) return substr($line, 0, 150); }
            }
            // Sinon cherche plusieurs // en début
            if (preg_match('/^\s*(\/\/[^\n]*\n){1,6}/', $content, $m2)) {
                $block = trim($m2[0]);
                $lines = preg_split('/\R/', $block);
                foreach ($lines as $line) {
                    $line = preg_replace('/^\s*\/\/\s?/', '', $line);
                    if ($line !== '') return substr($line, 0, 150);
                }
            }
            return null;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
