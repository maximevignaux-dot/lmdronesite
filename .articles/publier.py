# -*- coding: utf-8 -*-
"""Génère un article « Conseils » de lm-drone.fr à partir d'une fiche JSON.

Usage :  python3 .articles/publier.py .articles/fiches/<slug>.json

Ce que fait le script :
  1. vérifie la fiche (longueurs, images, liens internes, aucun prix) ;
  2. écrit conseils/<slug>.html avec le même gabarit que les autres guides ;
  3. ajoute la carte de l'article en tête de conseils/index.html ;
  4. ajoute l'adresse dans sitemap.xml et dans llms.txt.
Le dossier .articles commence par un point : GitHub Pages ne le publie pas.
"""
import html, json, os, re, sys
from datetime import date

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
TEMPLATE = REPO + 'conseils/quand-demousser-sa-toiture.html'
MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
FONDS = ['uploads/1000018124.jpg', 'uploads/1000018122.jpg', 'uploads/1000018085.jpg', 'uploads/1000018083.jpg']


def stop(msg):
    print('ERREUR :', msg)
    sys.exit(1)


def img_size(path):
    try:
        from PIL import Image
        return Image.open(REPO + path).size
    except Exception:
        return (1200, 800)


def page_exists(url):
    u = url.split('#')[0].split('?')[0].strip('/')
    if u == '':
        return True
    return any(os.path.isfile(REPO + p) for p in (u, u + '.html', u + '/index.html'))


def check(f):
    need = ['slug', 'titre', 'titre_court', 'description', 'chapo', 'lecture_min', 'image', 'image_alt', 'sections', 'service', 'a_lire_aussi']
    for k in need:
        if k not in f:
            stop(f'champ manquant : {k}')
    if not re.fullmatch(r'[a-z0-9]+(-[a-z0-9]+)*', f['slug']):
        stop('slug : minuscules, chiffres et tirets uniquement')
    if os.path.exists(REPO + f'conseils/{f["slug"]}.html') and not f.get('remplacer'):
        stop(f'conseils/{f["slug"]}.html existe déjà')
    if not 50 <= len(f['description']) <= 158:
        stop(f'description : {len(f["description"])} caractères (50 à 158 attendus)')
    if len(f['titre']) > 75:
        stop(f'titre : {len(f["titre"])} caractères (75 maximum)')
    for p in [f['image'], f.get('fond', FONDS[0])]:
        if not os.path.isfile(REPO + p):
            stop(f'image introuvable : {p}')
    text = json.dumps(f, ensure_ascii=False)
    if re.search(r'€|\beuros?\b|/m²|par m²|\bHT\b|\bTTC\b', text):
        stop('la fiche parle de prix : aucun tarif ne doit apparaître sur le site')
    for url in re.findall(r'href=\\?"(/[^"\\]*)', text) + [f['service']['url']]:
        if not page_exists(url):
            stop(f'lien interne cassé : {url}')
    for s in f['a_lire_aussi']:
        if not os.path.isfile(REPO + f'conseils/{s}.html'):
            stop(f'article à lire aussi introuvable : {s}')
    words = len(re.sub(r'<[^>]+>', ' ', ' '.join(p for s in f['sections'] for p in s.get('paragraphes', []) + s.get('liste', []))).split())
    if words < 450:
        stop(f'article trop court : {words} mots (450 minimum)')
    return words


def ld(obj):
    return '  <script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, indent=1) + '\n  </script>'


def build(f, words):
    tpl = open(TEMPLATE, encoding='utf-8').read()
    fonts = re.search(r'<link href="https://fonts\.googleapis\.com/css2[^>]*>', tpl).group(0)
    css = re.search(r'<link rel="stylesheet" href="/styles\.css\?v=\d+" />', tpl).group(0)
    header = tpl[tpl.index('<body>'):tpl.index('<main id="content">')]
    cta = tpl[tpl.index('<section class="cta-section"'):tpl.index('</main>')]
    footer = tpl[tpl.index('</main>'):]

    slug, url = f['slug'], f'https://lm-drone.fr/conseils/{f["slug"]}'
    d = f.get('date') or date.today().isoformat()
    y, m, j = map(int, d.split('-'))
    date_fr = f'{j} {MOIS[m - 1]} {y}'
    esc = lambda s: html.escape(s, quote=True)
    title = f['titre'] + ' | LM Drone'
    w, h = img_size(f['image'])
    fond = f.get('fond') or FONDS[sum(map(ord, slug)) % len(FONDS)]

    article_ld = {"@context": "https://schema.org", "@type": "Article", "headline": f['titre'], "description": f['description'],
                  "image": f"https://lm-drone.fr/{f['image']}", "datePublished": d, "dateModified": d, "inLanguage": "fr-FR",
                  "mainEntityOfPage": url, "wordCount": words,
                  "author": {"@type": "Organization", "name": "LM Drone", "url": "https://lm-drone.fr/"},
                  "publisher": {"@type": "Organization", "name": "LM Drone", "logo": {"@type": "ImageObject", "url": "https://lm-drone.fr/uploads/logo.png"}}}
    bc_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://lm-drone.fr/"},
        {"@type": "ListItem", "position": 2, "name": "Conseils", "item": "https://lm-drone.fr/conseils/"},
        {"@type": "ListItem", "position": 3, "name": f['titre_court'], "item": url}]}
    lds = [ld(article_ld), ld(bc_ld)]
    faq = f.get('faq') or []
    if faq:
        lds.append(ld({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q['question'], "acceptedAnswer": {"@type": "Answer", "text": re.sub(r'<[^>]+>', '', q['reponse'])}} for q in faq]}))

    head = f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#FFFFFF" />
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(f['description'])}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="{url}" />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content="fr_FR" />
  <meta property="og:site_name" content="LM Drone" />
  <meta property="og:title" content="{esc(title)}" />
  <meta property="og:description" content="{esc(f['description'])}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:image" content="https://lm-drone.fr/{f['image']}" />
  <meta property="og:image:width" content="{w}" />
  <meta property="og:image:height" content="{h}" />
  <meta property="article:published_time" content="{d}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" type="image/png" href="https://lm-drone.fr/uploads/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  {fonts}
  {css}
{chr(10).join(lds)}
</head>
'''
    body = []
    for s in f['sections']:
        body.append(f'      <h2>{s["titre"]}</h2>')
        body += [f'      <p>{p}</p>' for p in s.get('paragraphes', [])]
        if s.get('liste'):
            body.append('      <ul>\n' + '\n'.join(f'        <li>{x}</li>' for x in s['liste']) + '\n      </ul>')
        for p in s.get('apres_liste', []):
            body.append(f'      <p>{p}</p>')
    if faq:
        body.append('      <h2>Questions fréquentes</h2>')
        for q in faq:
            body.append(f'      <h3>{q["question"]}</h3>\n      <p>{q["reponse"]}</p>')
    svc = f['service']
    body.append(f'      <p><strong>Besoin d\'un avis sur votre toiture ou votre façade ?</strong> Découvrez notre service de <a href="{svc["url"]}">{svc["nom"]}</a>, ou <a href="/devis">demandez un devis gratuit</a> : réponse sous 48 heures.</p>')

    def h1_of(s):
        t = open(REPO + f'conseils/{s}.html', encoding='utf-8').read()
        return re.search(r'<h1[^>]*>(.*?)</h1>', t, re.S).group(1).strip()
    rel = '\n'.join(f'        <a href="/conseils/{s}" class="adv-item" style="text-decoration:none;"><span class="num">Guide</span><h3>{h1_of(s)}</h3><span style="color:var(--accent); font-size:13px; font-weight:600;">Lire →</span></a>' for s in f['a_lire_aussi'])

    cta = re.sub(r'(name="_subject" value="Demande de rappel — )[^"]*(")', r'\g<1>Conseils — ' + esc(f['titre_court']) + r' (site LM Drone)\2', cta)
    cta = re.sub(r'(name="page" value=")[^"]*(")', r'\g<1>' + url + r'\2', cta)

    page = head + header + f'''<main id="content">

<section class="page-header has-photo" style="--hero-img:url('/{fond}'); --hero-pos:center 40%;" data-screen-label="page-header">
  <div class="container container-narrow">
    <nav class="breadcrumb">
      <a href="/">Accueil</a><span>/</span>
      <a href="/conseils/">Conseils</a><span>/</span>
      <span style="color: var(--text);">{f['titre_court']}</span>
    </nav>
    <span class="eyebrow reveal">Conseil d'expert · {f['lecture_min']} min de lecture</span>
    <h1 class="h-1 reveal" style="margin-top:14px;">{f['titre']}</h1>
    <p class="lead reveal" style="margin-top:18px;">{f['chapo']}</p>
    <p class="article-meta">Par LM Drone, télépilote certifié DGAC · Publié le {date_fr}</p>
  </div>
</section>

<article class="tight">
  <div class="container container-narrow">
    <div class="reveal" style="overflow: hidden; border: 1px solid var(--border);">
      <img src="/{f['image']}" width="{w}" height="{h}" alt="{esc(f['image_alt'])}" loading="lazy" style="display:block; width:100%; height:auto; max-height:460px; object-fit:cover;" />
    </div>
    <div class="prose" style="margin-top:32px;">
{chr(10).join(body)}
    </div>
  </div>
</article>

<section class="tight" style="padding-top:0;">
  <div class="container container-narrow">
    <h2 class="h-2 reveal" style="margin-bottom:16px;">À lire aussi</h2>
    <div class="advantages reveal" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
{rel}
    </div>
  </div>
</section>

{cta}''' + footer
    open(REPO + f'conseils/{slug}.html', 'w', encoding='utf-8').write(page)

    # carte en tête de la page Conseils
    idx_path = REPO + 'conseils/index.html'
    idx = open(idx_path, encoding='utf-8').read()
    if f'href="/conseils/{slug}"' not in idx:
        card = f'''      <a href="/conseils/{slug}" class="service-card" style="text-decoration:none;">
        <div class="img-wrap"><img src="/{f['image']}" width="{w}" height="{h}" alt="{esc(f['image_alt'])}" loading="lazy" style="display:block; width:100%; height:100%; object-fit:cover;" /></div>
        <div class="content"><span class="num">{f['lecture_min']} min de lecture</span><h3>{f['titre']}</h3><p>{f['chapo']}</p><span class="link">Lire le guide →</span></div>
      </a>
'''
        marker = '<div class="services-grid reveal" style="grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));">\n'
        if marker not in idx:
            stop('grille des articles introuvable dans conseils/index.html')
        idx = idx.replace(marker, marker + card, 1)
        idx = idx.replace('"hasPart": [', '"hasPart": [{"@type": "Article", "headline": ' + json.dumps(f['titre'], ensure_ascii=False) + ', "url": "' + url + '"}, ', 1)
        open(idx_path, 'w', encoding='utf-8').write(idx)

    # sitemap
    sm_path = REPO + 'sitemap.xml'
    sm = open(sm_path, encoding='utf-8').read()
    if f'<loc>{url}</loc>' not in sm:
        sm = sm.replace('</urlset>', f'  <url>\n    <loc>{url}</loc>\n    <lastmod>{d}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n</urlset>')
    sm = re.sub(r'(<loc>https://lm-drone\.fr/conseils/</loc>\s*<lastmod>)[^<]+', r'\g<1>' + d, sm)
    open(sm_path, 'w', encoding='utf-8').write(sm)

    # llms.txt
    lp = REPO + 'llms.txt'
    if os.path.isfile(lp):
        l = open(lp, encoding='utf-8').read()
        if url not in l:
            line = f'- [{f["titre"]}]({url})'
            if '## Conseils' not in l:
                l = l.rstrip('\n') + '\n\n## Conseils\n'
            l = l.replace('## Conseils\n', '## Conseils\n' + line + '\n', 1)
            open(lp, 'w', encoding='utf-8').write(l)
    print(f'OK : conseils/{slug}.html ({words} mots), page Conseils, sitemap et llms.txt mis à jour')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        stop('usage : python3 .articles/publier.py .articles/fiches/<slug>.json')
    fiche = json.load(open(sys.argv[1], encoding='utf-8'))
    build(fiche, check(fiche))
