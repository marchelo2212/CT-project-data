
const fs = require('fs');

try {
    const csvContent = fs.readFileSync('src/viz_impact_rank.csv', 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    const data = lines.slice(1).map(line => {
        // Simple CSV parse: assume no commas in values for now, or handle quotes crudely
        // The file has some quoted titles "How to grow...". 
        // Let's use a regex for splitting correctly
        const values = [];
        let inQuote = false;
        let val = '';
        for (let char of line) {
            if (char === '"') inQuote = !inQuote;
            else if (char === ',' && !inQuote) {
                values.push(val);
                val = '';
            } else {
                val += char;
            }
        }
        values.push(val);
        
        const obj = {};
        headers.forEach((h, i) => obj[h.trim()] = values[i] ? values[i].trim() : '');
        return obj;
    });

    console.log('Total Rows:', data.length);

    // 1. Raw Data Filter
    const rawData = data.filter(d => 
        (+d.openalex_cited_by_count > 0) || (+d.altmetric_score > 0) || (+d.mendeley_reader_count > 0)
    );
    console.log('Raw Data (Metrics > 0):', rawData.length);

    // 2. Label Filter Logic
    const mapping = {
        'peripheral': 'broad'
    };
    const validKeys = ['core', 'broad', 'noise', 'none'];

    const finalData = rawData.filter(d => {
        let label = d.ct_label_v2 || d.ct_label || 'none';
        if (mapping[label]) label = mapping[label];
        if (!validKeys.includes(label)) label = 'none';
        
        return true; 
    });

    console.log('Final Data (All Labels):', finalData.length);

    // 3. Sort
    finalData.sort((a,b) => (+b.bridge_index) - (+a.bridge_index));

    // 4. Top 10
    const top10 = finalData.slice(0, 10);
    console.log('Top 10 Results:');
    top10.forEach((d, i) => {
        console.log(`${i+1}. ${d.title_short} (Bridge: ${d.bridge_index}, Label: ${d.ct_label_v2})`);
    });

} catch (err) {
    console.error('Error:', err);
}
