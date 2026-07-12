#!/usr/bin/env node

import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import archiver from 'archiver';
import * as tar from 'tar';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Archive-Erstellung für departure-monitor
 */
class ArchiveCreator {
  constructor() {
    this.distPath = path.join(projectRoot, 'dist');
    this.releasesPath = path.join(projectRoot, 'releases');
    this.packageJsonPath = path.join(projectRoot, 'package.json');
  }

  /**
   * Lädt die Version aus der package.json
   */
  async getVersion() {
    try {
      const packageData = await fs.readFile(this.packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageData);
      return packageJson.version;
    } catch (error) {
      throw new Error(`Fehler beim Lesen der package.json: ${error.message}`);
    }
  }

  /**
   * Überprüft ob das dist-Verzeichnis existiert
   */
  async checkDistExists() {
    try {
      const stats = await fs.stat(this.distPath);
      if (!stats.isDirectory()) {
        throw new Error('dist ist kein Verzeichnis');
      }
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error('dist-Verzeichnis existiert nicht. Führe zuerst "pnpm run build" aus.');
      }
      throw error;
    }
  }

  /**
   * Erstellt das releases-Verzeichnis falls es nicht existiert
   */
  async ensureReleasesDir() {
    try {
      await fs.mkdir(this.releasesPath, { recursive: true });
      console.log(chalk.green('✓'), 'releases/ Verzeichnis bereit');
    } catch (error) {
      throw new Error(`Fehler beim Erstellen des releases-Verzeichnisses: ${error.message}`);
    }
  }

  /**
   * Erstellt ein ZIP-Archiv
   */
  async createZipArchive(version) {
    const zipFilename = `departure-monitor-v${version}.zip`;
    const zipPath = path.join(this.releasesPath, zipFilename);

    console.log(chalk.blue('📦'), `Erstelle ZIP-Archiv: ${zipFilename}`);

    return new Promise((resolve, reject) => {
      const output = createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximale Kompression
      });

      let totalBytes = 0;
      let processedBytes = 0;

      output.on('close', () => {
        const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
        console.log(chalk.green('✓'), `ZIP-Archiv erstellt: ${zipFilename} (${sizeInMB} MB)`);
        resolve(zipPath);
      });

      archive.on('error', (err) => {
        reject(new Error(`ZIP-Archiv Fehler: ${err.message}`));
      });

      archive.on('progress', (progress) => {
        if (totalBytes === 0) {
          totalBytes = progress.entries.total;
        }
        processedBytes = progress.entries.processed;
        const percentage = totalBytes > 0 ? Math.round((processedBytes / totalBytes) * 100) : 0;
        process.stdout.write(`\r${chalk.yellow('⏳')} ZIP Progress: ${percentage}% (${processedBytes}/${totalBytes} Dateien)`);
      });

      archive.pipe(output);
      
      // Füge das gesamte dist-Verzeichnis hinzu, aber mit departure-monitor als Root
      archive.directory(this.distPath, 'departure-monitor');
      
      archive.finalize();
    });
  }

  /**
   * Erstellt ein TAR.GZ-Archiv
   */
  async createTarGzArchive(version) {
    const tarFilename = `departure-monitor-v${version}.tar.gz`;
    const tarPath = path.join(this.releasesPath, tarFilename);

    console.log(chalk.blue('📦'), `Erstelle TAR.GZ-Archiv: ${tarFilename}`);

    try {
      // Erstelle temporäres Verzeichnis für die korrekte Struktur
      const tempDir = path.join(this.releasesPath, '.temp');
      const tempAppDir = path.join(tempDir, 'departure-monitor');
      
      await fs.mkdir(tempAppDir, { recursive: true });
      
      // Kopiere dist-Inhalt in temporäres Verzeichnis
      await this.copyDirectory(this.distPath, tempAppDir);

      // Erstelle TAR.GZ
      await tar.create({
        gzip: true,
        file: tarPath,
        cwd: tempDir,
        prefix: '',
        // Zeige Progress
        filter: (path, stat) => {
          process.stdout.write(`\r${chalk.yellow('⏳')} TAR.GZ: Verarbeite ${path}`);
          return true;
        }
      }, ['departure-monitor']);

      // Aufräumen
      await fs.rm(tempDir, { recursive: true, force: true });

      const stats = await fs.stat(tarPath);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`\n${chalk.green('✓')} TAR.GZ-Archiv erstellt: ${tarFilename} (${sizeInMB} MB)`);
      
      return tarPath;
    } catch (error) {
      throw new Error(`TAR.GZ-Archiv Fehler: ${error.message}`);
    }
  }

  /**
   * Hilfsfunktion zum rekursiven Kopieren von Verzeichnissen
   */
  async copyDirectory(src, dest) {
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    await fs.mkdir(dest, { recursive: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Erstellt beide Archive
   */
  async createArchives() {
    try {
      console.log(chalk.cyan('🚀'), 'Starte Archive-Erstellung für departure-monitor...\n');

      // 1. Version laden
      const version = await this.getVersion();
      console.log(chalk.blue('📋'), `Version: ${version}`);

      // 2. Überprüfungen
      await this.checkDistExists();
      console.log(chalk.green('✓'), 'dist-Verzeichnis gefunden');

      await this.ensureReleasesDir();

      // 3. Archive erstellen
      const zipPath = await this.createZipArchive(version);
      const tarPath = await this.createTarGzArchive(version);

      console.log(chalk.green('\n🎉 Archive erfolgreich erstellt:'));
      console.log(chalk.white('  ZIP:'), path.relative(projectRoot, zipPath));
      console.log(chalk.white('  TAR.GZ:'), path.relative(projectRoot, tarPath));
      
      return { zipPath, tarPath, version };

    } catch (error) {
      console.error(chalk.red('\n❌ Fehler:'), error.message);
      process.exit(1);
    }
  }
}

// Hauptfunktion
async function main() {
  const archiveCreator = new ArchiveCreator();
  await archiveCreator.createArchives();
}

// Script ausführen wenn direkt aufgerufen
// pathToFileURL sorgt für korrekte file://-URLs auf allen Plattformen
// (unter Windows enthält process.argv[1] Backslashes und einen Laufwerksbuchstaben)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(chalk.red('Unerwarteter Fehler:'), error);
    process.exit(1);
  });
}

export default ArchiveCreator;