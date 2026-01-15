const fs = require('fs');
const readline = require('readline');

async function main() {
    console.log('Checking Dimensions Data...');
    const filePath = 'src/Data_sets/dimensions_data.jsonl';
    const counts = {};
    let total = 0;
    
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
            const val = data.type || 'UNDEFINED';
            counts[val] = (counts[val] || 0) + 1;
        } catch (e) {}
    }
    
    const report = [];
    report.push(`Total Lines: ${total}`);
    report.push('Types found:');
    Object.entries(counts).forEach(([k, v]) => {
        report.push(`${k}: ${v}`);
    });
    
    fs.writeFileSync('dimensions_report.txt', report.join('\n'));
    console.log('Done.');
}
main();
