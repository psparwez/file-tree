import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// - Recursive function to generate 
function generateFileTree(
    dirPath: string,
    basePath: string = '',
    prefix: string = ''
): string {
    let tree = '';
    const files = fs.readdirSync(dirPath);

    files.forEach((file, index) => {
        const fullPath = path.join(dirPath, file);
        const relativePath = path.relative(basePath, fullPath);
        const stats = fs.statSync(fullPath);
        const isLast = index === files.length - 1;

        const connector = isLast ? '└── ' : '├── ';
        tree += `${prefix}${connector}${file}\n`;

        if (stats.isDirectory()) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            tree += generateFileTree(fullPath, basePath, newPrefix);
        }
    });

    return tree;
}



// - generates the file tree and adds it to the clipboard or into a new README.md file
export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('file-tree.generate', () => {
        const folderUri = vscode.workspace.workspaceFolders?.[0].uri;

        if (!folderUri) {
            vscode.window.showErrorMessage('No workspace folder found!');
            return;
        }

        const folderPath = folderUri.fsPath;
        const tree = generateFileTree(folderPath);

        // - save the file tree (Clipboard or a new README.md)
        vscode.window.showQuickPick(['Copy to clipboard', 'Insert into README.md'], { placeHolder: 'Where to insert the file tree?' })
            .then(selection => {
                if (selection === 'Copy to clipboard') {
                    vscode.env.clipboard.writeText(tree).then(() => {
                        vscode.window.showInformationMessage('File tree copied to clipboard!');
                    });
                } else if (selection === 'Insert into README.md') {
                    const readmeUri = vscode.Uri.file(path.join(folderPath, 'README.md'));

                    vscode.workspace.openTextDocument(readmeUri).then(doc => {
                        const edit = new vscode.WorkspaceEdit();
                        const position = new vscode.Position(0, 0); // Set position at the beginning of the file
                        edit.insert(readmeUri, position, `# File Tree\n\n\`\`\`\n${tree}\n\`\`\``);

                        vscode.workspace.applyEdit(edit).then(() => {
                            vscode.window.showInformationMessage('File tree inserted into README.md!');
                        });
                    });
                }
            });
    });

    context.subscriptions.push(disposable);
}

// - extension is deactivated
export function deactivate() {}
