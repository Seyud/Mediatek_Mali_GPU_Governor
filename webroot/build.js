import fs from 'fs';
import path from 'path';

const webrootDir = path.resolve('.');
const componentsDir = path.join(webrootDir, 'components');

// 读取文件内容
function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf-8');
}

// 递归替换include指令
function processIncludes(content, baseDir) {
    const includeRegex = /<!--#include file="([^"]+)"\s*-->/g;
    return content.replace(includeRegex, (match, includePath) => {
        const fullPath = path.join(baseDir, includePath);
        if (fs.existsSync(fullPath)) {
            let includedContent = readFile(fullPath);
            // 递归处理被包含文件中的include指令
            includedContent = processIncludes(includedContent, path.dirname(fullPath));
            return includedContent;
        } else {
            console.warn(`警告: 找不到文件 ${fullPath}`);
            return match;
        }
    });
}

// 构建完整的HTML文件
function build() {
    console.log('开始构建模块化HTML文件...');
    
    // 读取主HTML文件
    const mainHtmlPath = path.join(webrootDir, 'index.html');
    let mainHtml = readFile(mainHtmlPath);
    
    // 处理include指令
    const builtHtml = processIncludes(mainHtml, webrootDir);
    
    // 写入构建后的文件
    const outputPath = path.join(webrootDir, 'index.built.html');
    fs.writeFileSync(outputPath, builtHtml, 'utf-8');
    
    console.log(`构建完成! 输出文件: ${outputPath}`);
}

// 执行构建
build();