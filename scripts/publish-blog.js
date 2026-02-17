const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://dntabmyurlrlnoajdnja.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGFibXl1cmxybG5vYWpkbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMDEyNjUsImV4cCI6MjA4NTY3NzI2NX0.PYpNd_t_px09zi2d5WGjFVOB23sjb3ZPuAnxagYshe0';
const ARTICLE_PATH = 'C:/Users/iitak/.gemini/antigravity/brain/b94ecf80-e015-4f55-91b4-4e2f0abf6714/article_ai_immunity.md';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function convertMarkdownToHtml(markdown) {
    let html = markdown;

    // Remove Title (Handled separately)
    // Matches # Title at the start
    const titleMatch = html.match(/^# (.*$)/m);
    let title = 'New Article';
    if (titleMatch) {
        title = titleMatch[1];
        html = html.replace(/^# .*$/m, ''); // Remove title from body
    }

    // Headers
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Math Blocks (Preserve $$...$$ but ensure they are on their own lines or wrapped effectively)
    // Actually MathJax handles $$...$$ nicely. We just need to make sure they aren't broken by paragraph tags.
    // A simple strategy is to let paragraphs take care of themselves.

    // Paragraphs
    // Split by double newlines
    let paragraphs = html.split(/\n\s*\n/);

    // Filter out empty paragraphs
    paragraphs = paragraphs.filter(p => p.trim() !== '');

    // Wrap each in <p> unless it starts with <h (header)
    const processedParagraphs = paragraphs.map(p => {
        p = p.trim();
        if (p.startsWith('<h')) return p; // Already a header
        if (p.startsWith('$$')) return `<div class="math-block">${p}</div>`; // Math block
        return `<p>${p}</p>`;
    });

    html = processedParagraphs.join('\n');

    return { title, content: html };
}

async function publishBlog() {
    console.log('🚀 Reading article from:', ARTICLE_PATH);

    try {
        const markdown = fs.readFileSync(ARTICLE_PATH, 'utf8');
        const { title, content } = convertMarkdownToHtml(markdown);

        console.log(`📝 Parsed Article: "${title}"`);
        // console.log('--- Content Preview ---\n', content.substring(0, 200), '\n-----------------------');

        // Excerpt (First paragraph plain text)
        const excerptMatch = content.match(/<p>(.*?)<\/p>/);
        let excerpt = excerptMatch ? excerptMatch[1].replace(/<[^>]*>/g, '').substring(0, 150) + '...' : 'A deep dive into Quant finance.';

        // Generate Slug
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

        const payload = {
            title: title,
            slug: slug,
            content: content,
            excerpt: excerpt,
            cover_image_url: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80', // Stock Market / Math image
            is_published: true,
            created_at: new Date().toISOString()
        };

        console.log('📤 Uploading to Supabase...');

        const { data, error } = await supabase
            .from('blogs')
            .insert([payload])
            .select();

        if (error) {
            console.error('❌ Error publishing blog:', error.message);
        } else {
            console.log('✅ Blog published successfully!');
            console.log('🆔 ID:', data[0].id);
            console.log('🔗 Title:', data[0].title);
        }

    } catch (err) {
        console.error('❌ Failed to read or process file:', err);
    }
}

publishBlog();
