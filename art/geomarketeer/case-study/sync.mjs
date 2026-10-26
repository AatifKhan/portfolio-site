import {readFile,writeFile} from 'node:fs/promises';

// Publish the same editable narrative into both static portfolio entrypoints.
// The existing story markup remains owned by its separate story controller.
const root=new URL('../../../',import.meta.url);
const draft=await readFile(new URL('draft.html',import.meta.url),'utf8');
for(const filename of ['index.html','minimal_portfolio.html']){
    const file=new URL(filename,root);
    let html=await readFile(file,'utf8');
    const start=html.indexOf('        <div id="caseStudyPage"');
    const end=html.indexOf('        <!-- Writing -->',start);
    const storyStart=html.indexOf('            <section id="geoStory"',start);
    const storyEnd=html.indexOf('</section>',storyStart)+10;
    if(start<0||end<0||storyStart<0||storyEnd<=storyStart)throw new Error('Case-study boundary missing: '+filename);
    const story=html.slice(storyStart,storyEnd);
    const content=draft.replace('<!-- APPROVED_STORY_OPENING -->',story);
    html=html.slice(0,start)+content+'\n'+html.slice(end);
    if(!html.includes('styles/geomarketeer-case-study.css'))html=html.replace('</head>','    <link rel="stylesheet" href="styles/geomarketeer-case-study.css?v=draft1">\n</head>');
    html=html.replace("let caseStudyView = 'quick';","let caseStudyView = 'full';");
    html=html.replace("navigate('caseStudy');\n            setCaseStudyView('quick', true);","navigate('caseStudy');\n            setCaseStudyView('full', true);");
    await writeFile(file,html);
}
console.log('Updated both portfolio case-study pages from draft.html. Existing story markup preserved.');
