const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

const dirs = ['app/api', 'lib/middleware', 'app/[orgSlug]/(workspace)/analytics'];
const files = dirs.flatMap(d => walkSync(d));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const updated = content.replace(
    /from ["']@\/lib\/visibility["']/g,
    'from "@/lib/visibility-server"'
  );
  if (updated !== content) {
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`Updated: ${file}`);
  }
});

console.log('Done!');
