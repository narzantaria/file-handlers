import path from "path";
import { access, lstat, mkdir, read, readdir, rename, rmdir, unlink } from "promiseman";
import CryptoJS from "crypto-js";

// get file name without extension
export function detachName(fileName: string): string {
  const index = fileName.lastIndexOf(".");
  if (index === -1) {
    return fileName;
  } else {
    return fileName.substring(0, index);
  }
}

// random symbols string +++
export const makeId = (length: number): string => {
  let result = "";
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// unique name for the image (based on makeId) +++
export const uniqName = (): string => {
  const newId = makeId(20);
  const prefix = CryptoJS.MD5(new Date().getTime().toString());
  return `${newId}-${prefix}`;
};

// check if the model file exists
export async function checkFileExists(fullPath: string): Promise<boolean> {
  try {
    await access(fullPath);
    return true;
  } catch (error) {
    return false;
  }
}

// Проверяет есть ли папка
export async function checkFolderExists(dir: string): Promise<boolean> {
  try {
    await access(dir);
    return true;
  } catch (error) {
    return false;
  }
}

export async function deleteFolderRecursive(folderPath: string) {
  let files = [];

  try {
    files = await readdir(folderPath);
  } catch (err) {
    // Если папка не существует, просто выходим из функции
    return;
  }

  for (const file of files) {
    const curPath = path.join(folderPath, file);

    try {
      const stats = await lstat(curPath);
      if (stats.isDirectory()) {
        // Рекурсивный вызов для удаления поддиректорий
        await deleteFolderRecursive(curPath);
      } else {
        // Удаление файла
        await unlink(curPath);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Удаление самой папки
  try {
    await rmdir(folderPath);
  } catch (err) {
    console.error(err);
  }
}

// Создает папку, если ее не существует
export async function mkDirNotExists(arg: string): Promise<void> {
  try {
    const exists = await checkFolderExists(arg);
    if (!exists) {
      await mkdir(arg);
    }
  } catch (error) {
    console.log(error);
  }
}

export async function readJSON(arg: string): Promise<object | null> {
  try {
    const rawData = await read(arg, "utf8");
    if (!rawData) return null;
    const data = JSON.parse(rawData);
    return typeof data === "object" ? data : null;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// СТАРАЯ ФУНКЦИЯ, НАДО УБРАТЬ!!!
export const docImages = async (
  root = "dist",
  userdir: string,
): Promise<string | undefined> => {
  // Проверка, чтобы вдруг не удалили всю папку "dist"
  if (!userdir.length) {
    console.log("The userdir argument should be not empty!");
    return;
  } else if (userdir.slice(-4) === "dist") {
    console.log("Invalid userdir argument!");
    return;
  }
  const ROOT_DIR = `${process.cwd()}/${root}`;
  try {
    const imagesFolderName = uniqName();
    const files = await readdir(`${ROOT_DIR}/${userdir}`, {
      withFileTypes: true,
    });
    const fileNames = files.map((dirent) => dirent.name);
    const subDir = imagesFolderName.slice(0, 2).toLowerCase();
    const checkSubDir = await readdir(ROOT_DIR, { withFileTypes: true });
    const checkSubDir2 = checkSubDir
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .some((x) => x == subDir);
    if (!checkSubDir2) {
      await mkdir(`${ROOT_DIR}/${subDir}`);
    }
    await mkdir(`${ROOT_DIR}/${subDir}/${imagesFolderName}`);
    for (let x = 0; x < fileNames.length; x++) {
      await rename(
        `${ROOT_DIR}/${userdir}/${fileNames[x]}`,
        `${ROOT_DIR}/${subDir}/${imagesFolderName}/${fileNames[x]}`,
      );
    }
    // НОВОЕ!!! УДАЛЯЕМ ВРЕМЕННУЮ ПАПКУ!!! ЭТО ТОЧНО МОЖНО???
    await rmdir(`${ROOT_DIR}/${userdir}`);
    return `${subDir}/${imagesFolderName}`;
  } catch (error) {
    console.log(error);
  }
};

// Чистит папку, удаляет все что внутри (и файлы и папки), оставляя саму папку.
async function clearDir(dir: string, root = "dist"): Promise<void> {
  const ROOT_DIR = `${process.cwd()}/${root}`;
  try {
    const files = await readdir(ROOT_DIR + "/" + dir, { withFileTypes: true });
    const filteredFiles = files
      .filter((dirent) => dirent.isFile())
      .map((dirent) => dirent.name);
    const filteredDirs = files
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    if (filteredFiles.length > 0) {
      for (let x = 0; x < filteredFiles.length; x++) {
        const fileToRemove = ROOT_DIR + "/" + dir + "/" + filteredFiles[x];
        await unlink(fileToRemove);
      }
    }
    if (filteredDirs.length > 0) {
      for (let x = 0; x < filteredDirs.length; x++) {
        const fileToRemove = ROOT_DIR + "/" + dir + "/" + filteredDirs[x];
        await rmdir(fileToRemove);
      }
    }
  } catch (error) {
    console.log(`Cleardir error: ${error}`);
  }
}

/*
Очень интересная функция! Принимает путь типа fj/fje967VEEEqsups5Lxi5-487f7b22f68312d2c1bbc93b1aea445b
Удаляет папку (что после /), не удаляя 'fj', если в последней есть другие папки!
В противном случае, удаляет и папку 'fj'
*/
export const rmDocDir = async (
  dir: string,
  root = "dist",
): Promise<string | undefined> => {
  // Проверка, чтобы вдруг не удалили всю папку "dist"
  if (!dir.length) {
    console.log("The dir argument should be not empty!");
    return;
  } else if (dir.slice(-4) === "dist") {
    console.log("Invalid dir argument!");
    return;
  }
  const ROOT_DIR = `${process.cwd()}/${root}`;
  try {
    await clearDir(dir);
    const parent = dir.slice(0, 2);
    const filesRaw = await readdir(`${ROOT_DIR}/${parent}`, {
      withFileTypes: true,
    });
    const filtered = filesRaw
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    if (filtered.length > 1) {
      await rmdir(`${ROOT_DIR}/${dir}`);
    } else {
      await rmdir(`${ROOT_DIR}/${dir}`);
      await rmdir(`${ROOT_DIR}/${parent}`);
    }
    return "Removed";
  } catch (error) {
    console.log(`Smartremove error: ${error}`);
  }
};

// Read all files in directory and subdirectories recursively and return names (not paths)
export async function getFileNames(dir: string): Promise<string[]> {
  let files: string[] = [];

  const readDirectory = async (currentDir: string) => {
    const content = await readdir(currentDir, { withFileTypes: true });

    for (const item of content) {
      const itemPath = path.join(currentDir, item.name);

      if (item.isDirectory()) {
        await readDirectory(itemPath);
      } else {
        files.push(item.name);
      }
    }
  };

  await readDirectory(dir);

  return files;
}

export async function getFileNamesWithoutExtensions(dir: string): Promise<string[] | undefined> {
  try {
    const names = await readdir(dir);
    const splittedlNames = names.map((x) => x.replace(/\.[^/.]+$/, ""));
    return splittedlNames;
  } catch (error) {
    console.log(error);
  }
}

// Read all directories in directory and subdirectories recursively and return names (not paths)
export async function getDirNames(dir: string): Promise<string[]> {
  let result: string[] = [];

  const files = await readdir(dir, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      result.push(file.name);
      const subdirs = await getDirNames(`${dir}/${file.name}`);
      if (subdirs.length) {
        result = result.concat(subdirs);
      }
    }
  }

  return result.reduce(
    (a: any[], b) => (a.some((elem) => elem === b) ? a : a.concat([b])),
    [],
  );
}