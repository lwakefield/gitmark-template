const fs = require('fs');
const cp = require('child_process');

function getLines (str) {
    return str.toString()
        .split('\n')
        .map(v => v.trim())
        .filter(v => v !== '');
}

const srcFiles = fs.readdirSync('bookmarks')
    .filter(v => v.endsWith('.jsonl'));

const bookmarks = [];

for (const srcFile of srcFiles) {
    const lines = fs.readFileSync('bookmarks/' + srcFile)
        .toString()
        .split('\n')
        .map(v => v.trim())
        .filter(v => v !== '');
    for (const line of lines) {
        const bookmark = JSON.parse(line);
        bookmarks.push(bookmark);
    }
}

bookmarks.sort((a, b) => {
    return b.createdAt - a.createdAt;
});

const bookmarksGroupedByDay = {};

for (const bookmark of bookmarks) {
    const createdAt = new Date(bookmark.createdAt);
    createdAt.setHours(0);
    createdAt.setMinutes(0);
    createdAt.setSeconds(0);
    createdAt.setMilliseconds(0);

    const day = createdAt.toISOString();

    if (!bookmarksGroupedByDay[day]) bookmarksGroupedByDay[day] = [];

    bookmarksGroupedByDay[day].push(bookmark);
}

let readme = '# Bookmarks\n';

const bookmarksGroupedByDayEntries = Object.entries(bookmarksGroupedByDay)
    .sort((left, right) => right[0] > left[0] ? 1 : -1 );
for (const [ _date, bookmarks ] of bookmarksGroupedByDayEntries) {
    const date = new Date(_date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    readme += `\n## ${year}-${month}-${day}\n`;
    for (const bookmark of bookmarks) {
        readme += `- [${bookmark.title || bookmark.url}](${bookmark.url})`;
        if (bookmark.description) readme += ` - ${bookmark.description.replace(/\n/g, ' ')}`;
        readme += '\n';
    }
}

fs.writeFileSync('readme.md', readme);

const [ , user ] = getLines(cp.execSync('git log -1 --format=email'));
const [ , name, email ] = user.match(/From: (.+) <(.+)>/)

cp.execSync(`git config --local user.name "${name}"`)
cp.execSync(`git config --local user.email "${email}"`)
cp.execSync(`git add readme.md`);
cp.execSync(`git commit -m "Rendered readme.md"`);
cp.execSync(`git push origin master`);
