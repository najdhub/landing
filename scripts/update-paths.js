const fs = require('fs');
const path = require('path');

// Update HTML file paths for new structure
const htmlFile = 'src/pages/index.html';

if (fs.existsSync(htmlFile)) {
    let content = fs.readFileSync(htmlFile, 'utf8');
    
    // Update image paths
    content = content.replace(/src="images\//g, 'src="assets/images/');
    content = content.replace(/src="\.\/images\//g, 'src="assets/images/');
    
    // Update CSS paths
    content = content.replace(/href="([^"]*\.css)"/g, 'href="css/$1"');
    
    // Update JS paths
    content = content.replace(/src="([^"]*\.js)"/g, 'src="js/$1"');
    
    fs.writeFileSync(htmlFile, content);
    console.log('✅ Updated paths in index.html');
} else {
    console.log('❌ index.html not found in src/pages/');
}
