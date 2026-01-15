const fs = require('fs');
const readline = require('readline');
const path = require('path');

const files = [
    { path: 'src/Data_sets/dimensions_data.jsonl', field: 'type' },
    { path: 'src/Data_sets/lens_bulk_data.jsonl', field: 'publication_type' }
];

async function processFile(filePath, fieldName) {
    console.log(`Processing ${filePath}...`);
    const counts = {};
    let total = 0;
    
    try {
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            total++;
            try {
                if (!line.trim()) continue;
                const data = JSON.parse(line);
                const val = data[fieldName] || 'UNDEFINED';
                counts[val] = (counts[val] || 0) + 1;
            } catch (e) {
                // ignore parse errors
            }
        }
        
        return { file: filePath, total, counts };
    } catch (e) {
        return { file: filePath, error: e.message };
    }
}

async function main() {
    const report = [];
    for (const file of files) {
        const result = await processFile(file.path, file.field);
        report.push(`File: ${result.file}`);
        if (result.error) {
            report.push(`Error: ${result.error}`);
        } else {
            report.push(`Total Lines: ${result.total}`);
            report.push('Unique Values:');
            Object.entries(result.counts).forEach(([k, v]) => {
                report.push(`  ${k}: ${v}`);
            });
        }
        report.push('-----------------------------------');
    }
    
    fs.writeFileSync('data_report.txt', report.join('\n'));
    console.log('Report written to data_report.txt');
}

main();
