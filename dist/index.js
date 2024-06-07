"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirNames = exports.getFileNamesWithoutExtensions = exports.getFileNames = exports.rmDocDir = exports.docImages = exports.readJSON = exports.mkDirNotExists = exports.deleteFolderRecursive = exports.checkFolderExists = exports.checkFileExists = exports.uniqName = exports.makeId = exports.detachName = void 0;
const path_1 = __importDefault(require("path"));
const promiseman_1 = require("promiseman");
const crypto_js_1 = __importDefault(require("crypto-js"));
// get file name without extension
function detachName(fileName) {
    const index = fileName.lastIndexOf(".");
    if (index === -1) {
        return fileName;
    }
    else {
        return fileName.substring(0, index);
    }
}
exports.detachName = detachName;
// random symbols string +++
const makeId = (length) => {
    let result = "";
    const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};
exports.makeId = makeId;
// unique name for the image (based on makeId) +++
const uniqName = () => {
    const newId = (0, exports.makeId)(20);
    const prefix = crypto_js_1.default.MD5(new Date().getTime().toString());
    return `${newId}-${prefix}`;
};
exports.uniqName = uniqName;
// check if the model file exists
async function checkFileExists(fullPath) {
    try {
        await (0, promiseman_1.access)(fullPath);
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.checkFileExists = checkFileExists;
// Проверяет есть ли папка
async function checkFolderExists(dir) {
    try {
        await (0, promiseman_1.access)(dir);
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.checkFolderExists = checkFolderExists;
async function deleteFolderRecursive(folderPath) {
    let files = [];
    try {
        files = await (0, promiseman_1.readdir)(folderPath);
    }
    catch (err) {
        // Если папка не существует, просто выходим из функции
        return;
    }
    for (const file of files) {
        const curPath = path_1.default.join(folderPath, file);
        try {
            const stats = await (0, promiseman_1.lstat)(curPath);
            if (stats.isDirectory()) {
                // Рекурсивный вызов для удаления поддиректорий
                await deleteFolderRecursive(curPath);
            }
            else {
                // Удаление файла
                await (0, promiseman_1.unlink)(curPath);
            }
        }
        catch (err) {
            console.error(err);
        }
    }
    // Удаление самой папки
    try {
        await (0, promiseman_1.rmdir)(folderPath);
    }
    catch (err) {
        console.error(err);
    }
}
exports.deleteFolderRecursive = deleteFolderRecursive;
// Создает папку, если ее не существует
async function mkDirNotExists(arg) {
    try {
        const exists = await checkFolderExists(arg);
        if (!exists) {
            await (0, promiseman_1.mkdir)(arg);
        }
    }
    catch (error) {
        console.log(error);
    }
}
exports.mkDirNotExists = mkDirNotExists;
async function readJSON(arg) {
    try {
        const rawData = await (0, promiseman_1.read)(arg, "utf8");
        if (!rawData)
            return null;
        const data = JSON.parse(rawData);
        return typeof data === "object" ? data : null;
    }
    catch (error) {
        console.log(error);
        return null;
    }
}
exports.readJSON = readJSON;
// СТАРАЯ ФУНКЦИЯ, НАДО УБРАТЬ!!!
const docImages = async (root = "dist", userdir) => {
    // Проверка, чтобы вдруг не удалили всю папку "dist"
    if (!userdir.length) {
        console.log("The userdir argument should be not empty!");
        return;
    }
    else if (userdir.slice(-4) === "dist") {
        console.log("Invalid userdir argument!");
        return;
    }
    const ROOT_DIR = `${process.cwd()}/${root}`;
    try {
        const imagesFolderName = (0, exports.uniqName)();
        const files = await (0, promiseman_1.readdir)(`${ROOT_DIR}/${userdir}`, {
            withFileTypes: true,
        });
        const fileNames = files.map((dirent) => dirent.name);
        const subDir = imagesFolderName.slice(0, 2).toLowerCase();
        const checkSubDir = await (0, promiseman_1.readdir)(ROOT_DIR, { withFileTypes: true });
        const checkSubDir2 = checkSubDir
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name)
            .some((x) => x == subDir);
        if (!checkSubDir2) {
            await (0, promiseman_1.mkdir)(`${ROOT_DIR}/${subDir}`);
        }
        await (0, promiseman_1.mkdir)(`${ROOT_DIR}/${subDir}/${imagesFolderName}`);
        for (let x = 0; x < fileNames.length; x++) {
            await (0, promiseman_1.rename)(`${ROOT_DIR}/${userdir}/${fileNames[x]}`, `${ROOT_DIR}/${subDir}/${imagesFolderName}/${fileNames[x]}`);
        }
        // НОВОЕ!!! УДАЛЯЕМ ВРЕМЕННУЮ ПАПКУ!!! ЭТО ТОЧНО МОЖНО???
        await (0, promiseman_1.rmdir)(`${ROOT_DIR}/${userdir}`);
        return `${subDir}/${imagesFolderName}`;
    }
    catch (error) {
        console.log(error);
    }
};
exports.docImages = docImages;
// Чистит папку, удаляет все что внутри (и файлы и папки), оставляя саму папку.
async function clearDir(dir, root = "dist") {
    const ROOT_DIR = `${process.cwd()}/${root}`;
    try {
        const files = await (0, promiseman_1.readdir)(ROOT_DIR + "/" + dir, { withFileTypes: true });
        const filteredFiles = files
            .filter((dirent) => dirent.isFile())
            .map((dirent) => dirent.name);
        const filteredDirs = files
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);
        if (filteredFiles.length > 0) {
            for (let x = 0; x < filteredFiles.length; x++) {
                const fileToRemove = ROOT_DIR + "/" + dir + "/" + filteredFiles[x];
                await (0, promiseman_1.unlink)(fileToRemove);
            }
        }
        if (filteredDirs.length > 0) {
            for (let x = 0; x < filteredDirs.length; x++) {
                const fileToRemove = ROOT_DIR + "/" + dir + "/" + filteredDirs[x];
                await (0, promiseman_1.rmdir)(fileToRemove);
            }
        }
    }
    catch (error) {
        console.log(`Cleardir error: ${error}`);
    }
}
/*
Очень интересная функция! Принимает путь типа fj/fje967VEEEqsups5Lxi5-487f7b22f68312d2c1bbc93b1aea445b
Удаляет папку (что после /), не удаляя 'fj', если в последней есть другие папки!
В противном случае, удаляет и папку 'fj'
*/
const rmDocDir = async (dir, root = "dist") => {
    // Проверка, чтобы вдруг не удалили всю папку "dist"
    if (!dir.length) {
        console.log("The dir argument should be not empty!");
        return;
    }
    else if (dir.slice(-4) === "dist") {
        console.log("Invalid dir argument!");
        return;
    }
    const ROOT_DIR = `${process.cwd()}/${root}`;
    try {
        await clearDir(dir);
        const parent = dir.slice(0, 2);
        const filesRaw = await (0, promiseman_1.readdir)(`${ROOT_DIR}/${parent}`, {
            withFileTypes: true,
        });
        const filtered = filesRaw
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);
        if (filtered.length > 1) {
            await (0, promiseman_1.rmdir)(`${ROOT_DIR}/${dir}`);
        }
        else {
            await (0, promiseman_1.rmdir)(`${ROOT_DIR}/${dir}`);
            await (0, promiseman_1.rmdir)(`${ROOT_DIR}/${parent}`);
        }
        return "Removed";
    }
    catch (error) {
        console.log(`Smartremove error: ${error}`);
    }
};
exports.rmDocDir = rmDocDir;
// Read all files in directory and subdirectories recursively and return names (not paths)
async function getFileNames(dir) {
    let files = [];
    const readDirectory = async (currentDir) => {
        const content = await (0, promiseman_1.readdir)(currentDir, { withFileTypes: true });
        for (const item of content) {
            const itemPath = path_1.default.join(currentDir, item.name);
            if (item.isDirectory()) {
                await readDirectory(itemPath);
            }
            else {
                files.push(item.name);
            }
        }
    };
    await readDirectory(dir);
    return files;
}
exports.getFileNames = getFileNames;
async function getFileNamesWithoutExtensions(dir) {
    try {
        const names = await (0, promiseman_1.readdir)(dir);
        const splittedlNames = names.map((x) => x.replace(/\.[^/.]+$/, ""));
        return splittedlNames;
    }
    catch (error) {
        console.log(error);
    }
}
exports.getFileNamesWithoutExtensions = getFileNamesWithoutExtensions;
// Read all directories in directory and subdirectories recursively and return names (not paths)
async function getDirNames(dir) {
    let result = [];
    const files = await (0, promiseman_1.readdir)(dir, { withFileTypes: true });
    for (const file of files) {
        if (file.isDirectory()) {
            result.push(file.name);
            const subdirs = await getDirNames(`${dir}/${file.name}`);
            if (subdirs.length) {
                result = result.concat(subdirs);
            }
        }
    }
    return result.reduce((a, b) => (a.some((elem) => elem === b) ? a : a.concat([b])), []);
}
exports.getDirNames = getDirNames;
