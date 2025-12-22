// modelLoader.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const loadModels = async () => {
  const models = {};
  try {
    // Get the directory path of the current module
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    // Get a list of all files in the models directory
    const modelFiles = fs.readdirSync(path.join(__dirname, '..', 'models'));
    // Load each model file dynamically
    for (const file of modelFiles) {
      if (file.endsWith('.js')) {
        const modelName = file.replace('.js', '');
        const modelPath = path.join(__dirname, '..', 'models', file);
        const { default: model } = await import(`file://${modelPath}`);
        models[modelName] = model;
      }
    }
    return models;
  } catch (error) {
    console.log('Error occurred while loading Models\n' + error);
  }
}