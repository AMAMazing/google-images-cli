#!/usr/bin/env node
import { Command } from 'commander';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('google-images')
  .description('CLI tool to download Google images')
  .version('1.0.0')
  .requiredOption('-q, --query <string>', 'search query')
  .option('-o, --output <directory>', 'output directory', process.cwd())
  .option('-l, --limit <number>', 'number of images to download', '10')
  .parse(process.argv);

const options = program.opts();

async function downloadImage(url, outputPath, filename) {
  try {
    const response = await axios({
      url,
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const extension = url.split('.').pop().split('?')[0] || 'jpg';
    const fullPath = path.join(outputPath, `${filename}.${extension}`);
    
    await fs.ensureDir(outputPath);
    await fs.writeFile(fullPath, response.data);
    return true;
  } catch (error) {
    return false;
  }
}

async function searchImages(query, limit) {
  try {
    // First get the Bing search page
    const response = await axios.get('https://www.bing.com/images/search', {
      params: {
        q: query,
        qft: '+filterui:license-L2_L3_L4',
        FORM: 'IRFLTR'
      },
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    const $ = cheerio.load(response.data);
    const imageUrls = [];

    // Extract image URLs from Bing's search results
    $('.iusc').each((_, elem) => {
      try {
        const m = $(elem).attr('m');
        if (m) {
          const metadata = JSON.parse(m);
          if (metadata.murl) {
            imageUrls.push(metadata.murl);
          }
        }
      } catch (e) {
        // Skip if JSON parsing fails
      }
    });

    // Remove duplicates and validate URLs
    const uniqueUrls = [...new Set(imageUrls)].filter(url => {
      try {
        new URL(url);
        return url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)/i);
      } catch {
        return false;
      }
    });

    return uniqueUrls.slice(0, parseInt(limit));
  } catch (error) {
    console.error(chalk.red('Error searching for images:', error.message));
    return [];
  }
}

async function main() {
  const spinner = ora('Searching for images...').start();
  
  try {
    const outputPath = path.resolve(options.output);
    const images = await searchImages(options.query, options.limit);
    
    if (images.length === 0) {
      spinner.fail(chalk.red('No images found'));
      process.exit(1);
    }

    spinner.text = 'Downloading images...';
    
    let successCount = 0;
    for (let i = 0; i < images.length; i++) {
      const success = await downloadImage(images[i], outputPath, `image_${i + 1}`);
      if (success) successCount++;
    }

    spinner.succeed(chalk.green(`Downloaded ${successCount} images to ${outputPath}`));
  } catch (error) {
    spinner.fail(chalk.red('Error:', error.message));
    process.exit(1);
  }
}

main();
