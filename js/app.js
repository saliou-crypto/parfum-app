// ========== UTILITAIRES ==========

function getProduits() {
  return JSON.parse(localStorage.getItem('produits')) || [];
}

function saveProduits(produits) {
  localStorage.setItem('produits', JSON.stringify(produits));
}

function getVentes() {
  return JSON.parse(localStorage.getItem('ventes')) || [];
}

function saveVentes(ventes) {
  localStorage.setItem('ventes', JSON.stringify(ventes));
}

function getFactures() {
  return JSON.parse(localStorage.getItem('factures')) || [];
}

function saveFactures(factures) {
  localStorage.setItem('factures', JSON.stringify(factures));
}

function formaterDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ========== PHOTOS ==========

let photoEnCours = null;

function previewPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    photoEnCours = e.target.result;
    document.getElementById('photo-preview-zone').innerHTML = `
      <img src="${photoEnCours}" class="photo-preview-img" />
      <p style="font-size:11px; color:#c026d3; margin-top:6px;">Appuie pour changer</p>
    `;
  };
  reader.readAsDataURL(file);
}

// ========== PRODUITS ==========

function ajouterProduit() {
  const nom = document.getElementById('nom-produit').value.trim();
  const prix = parseInt(document.getElementById('prix-produit').value);
  const stock = parseInt(document.getElementById('stock-produit').value);

  if (!nom || !prix || !stock) {
    alert('Remplis tous les champs !');
    return;
  }

  const produits = getProduits();
  produits.push({
    id: Date.now(),
    nom,
    prix,
    stock,
    photo: photoEnCours || null
  });
  saveProduits(produits);

  document.getElementById('nom-produit').value = '';
  document.getElementById('prix-produit').value = '';
  document.getElementById('stock-produit').value = '';
  document.getElementById('photo-preview-zone').innerHTML = `
    <span style="font-size:28px;">📷</span>
    <p style="font-size:13px; color:#999; margin-top:4px;">Ajouter une photo</p>
  `;
  photoEnCours = null;

  afficherProduits();
}

function supprimerProduit(id) {
  let produits = getProduits().filter(p => p.id !== id);
  saveProduits(produits);
  afficherProduits();
}

function ouvrirModification(id) {
  const produits = getProduits();
  const p = produits.find(p => p.id === id);
  if (!p) return;

  document.getElementById('nom-produit').value = p.nom;
  document.getElementById('prix-produit').value = p.prix;
  document.getElementById('stock-produit').value = p.stock;

  if (p.photo) {
    photoEnCours = p.photo;
    document.getElementById('photo-preview-zone').innerHTML = `
      <img src="${p.photo}" class="photo-preview-img" />
      <p style="font-size:11px; color:#c026d3; margin-top:6px;">Appuie pour changer</p>
    `;
  }

  const btn = document.querySelector('.formulaire button');
  btn.textContent = 'Modifier le produit';
  btn.onclick = () => enregistrerModification(id);

  document.querySelector('.formulaire').scrollIntoView({ behavior: 'smooth' });
}

function enregistrerModification(id) {
  const nom = document.getElementById('nom-produit').value.trim();
  const prix = parseInt(document.getElementById('prix-produit').value);
  const stock = parseInt(document.getElementById('stock-produit').value);

  if (!nom || !prix || !stock) {
    alert('Remplis tous les champs !');
    return;
  }

  let produits = getProduits();
  produits = produits.map(p => p.id === id ? {
    ...p, nom, prix, stock,
    photo: photoEnCours || p.photo
  } : p);
  saveProduits(produits);

  const btn = document.querySelector('.formulaire button');
  btn.textContent = 'Ajouter le produit';
  btn.onclick = ajouterProduit;

  document.getElementById('nom-produit').value = '';
  document.getElementById('prix-produit').value = '';
  document.getElementById('stock-produit').value = '';
  document.getElementById('photo-preview-zone').innerHTML = `
    <span style="font-size:28px;">📷</span>
    <p style="font-size:13px; color:#999; margin-top:4px;">Ajouter une photo</p>
  `;
  photoEnCours = null;

  afficherProduits();
}

function afficherProduits() {
  const liste = document.getElementById('liste-produits');
  if (!liste) return;

  const produits = getProduits();
  if (produits.length === 0) {
    liste.innerHTML = '<p class="vide">Aucun produit ajouté</p>';
    return;
  }

  liste.innerHTML = produits.map(p => `
    <div class="produit-item">
      ${p.photo
        ? `<img src="${p.photo}" class="produit-photo" />`
        : `<div class="produit-icon">🌸</div>`
      }
      <div class="produit-info">
        <p>${p.nom}</p>
        <p>${p.prix.toLocaleString()} F CFA · Stock: ${p.stock}</p>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-modifier" onclick="ouvrirModification(${p.id})">✏️</button>
        <button class="btn-supprimer" onclick="supprimerProduit(${p.id})">🗑</button>
      </div>
    </div>
  `).join('');
}

// ========== VENTES ==========

let panier = [];

function chargerSelectProduits() {
  const select = document.getElementById('produit-vente');
  if (!select) return;

  const produits = getProduits();
  select.innerHTML = '<option value="">-- Choisir un parfum --</option>';
  produits.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.nom} — ${p.prix.toLocaleString()} F CFA (stock: ${p.stock})</option>`;
  });
}

function ajouterAuPanier() {
  const selectEl = document.getElementById('produit-vente');
  const qte = parseInt(document.getElementById('quantite-vente').value);

  if (!selectEl.value || !qte || qte <= 0) {
    alert('Choisis un produit et une quantité !');
    return;
  }

  const produits = getProduits();
  const produit = produits.find(p => p.id == selectEl.value);
  if (!produit) return;

  const dejaAuPanier = panier.filter(i => i.produitId == produit.id)
    .reduce((s, i) => s + i.quantite, 0);

  if (qte + dejaAuPanier > produit.stock) {
    alert(`Stock insuffisant ! Il reste seulement ${produit.stock - dejaAuPanier} unité(s) disponible(s).`);
    return;
  }

  const existant = panier.find(i => i.produitId == produit.id);
  if (existant) {
    existant.quantite += qte;
    existant.total = existant.prix * existant.quantite;
  } else {
    panier.push({
      produitId: produit.id,
      produitNom: produit.nom,
      prix: produit.prix,
      quantite: qte,
      total: produit.prix * qte
    });
  }

  selectEl.value = '';
  document.getElementById('quantite-vente').value = '';
  afficherPanier();
}

function afficherPanier() {
  const section = document.getElementById('panier-section');
  const liste = document.getElementById('panier-liste');
  if (!section || !liste) return;

  if (panier.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';
  liste.innerHTML = panier.map((item, index) => `
    <div class="vente-item" style="margin-bottom:8px;">
      <div class="vente-info">
        <p>${item.produitNom} x${item.quantite}</p>
        <p>${item.prix.toLocaleString()} F CFA / unité</p>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
        <span class="vente-montant">${item.total.toLocaleString()} F</span>
        <button onclick="retirerDuPanier(${index})" style="background:none; border:none; font-size:14px; cursor:pointer; color:#e11d48;">✕ Retirer</button>
      </div>
    </div>
  `).join('');

  const total = panier.reduce((s, i) => s + i.total, 0);
  document.getElementById('total-panier').textContent = total.toLocaleString() + ' F CFA';
}

function retirerDuPanier(index) {
  panier.splice(index, 1);
  afficherPanier();
}

function viderPanier() {
  panier = [];
  afficherPanier();
}

function validerVente() {
  if (panier.length === 0) {
    alert('Le panier est vide !');
    return;
  }

  const client = document.getElementById('client-vente').value.trim() || 'Client anonyme';

  let produits = getProduits();
  for (const item of panier) {
    const produit = produits.find(p => p.id === item.produitId);
    if (!produit || item.quantite > produit.stock) {
      alert(`Stock insuffisant pour ${item.produitNom} !`);
      return;
    }
  }

  for (const item of panier) {
    const produit = produits.find(p => p.id === item.produitId);
    produit.stock -= item.quantite;
  }
  saveProduits(produits);

  const totalGeneral = panier.reduce((s, i) => s + i.total, 0);
  const ventes = getVentes();
  ventes.unshift({
    id: Date.now(),
    client,
    articles: [...panier],
    total: totalGeneral,
    date: Date.now()
  });
  saveVentes(ventes);

  afficherMessage('Vente enregistrée ! ✅');

  panier = [];
  document.getElementById('client-vente').value = '';
  afficherPanier();
  afficherHistoriqueVentes();
  chargerSelectProduits();
  afficherDernieresVentes();
  calculerStats();
  afficherAlertes();
}

function supprimerVente(id) {
  if (!confirm('Supprimer cette vente et sa facture ?')) return;

  const vente = getVentes().find(v => v.id === id);
  if (vente) {
    let produits = getProduits();
    const articles = vente.articles || [{ produitId: vente.produitId, quantite: vente.quantite }];
    for (const item of articles) {
      const produit = produits.find(p => p.id === item.produitId);
      if (produit) produit.stock += item.quantite;
    }
    saveProduits(produits);
  }

  saveVentes(getVentes().filter(v => v.id !== id));
  saveFactures(getFactures().filter(f => f.venteId !== id));

  afficherHistoriqueVentes();
  afficherDernieresVentes();
  calculerStats();
  afficherListeFactures();
}

function afficherHistoriqueVentes() {
  const liste = document.getElementById('historique-ventes');
  if (!liste) return;

  const ventes = getVentes();
  if (ventes.length === 0) {
    liste.innerHTML = '<p class="vide">Aucune vente enregistrée</p>';
    return;
  }

  liste.innerHTML = ventes.map(v => `
    <div class="vente-item">
      <div class="vente-info" onclick="genererPDFDepuisVente(${v.id})" style="cursor:pointer; flex:1;">
        <p>${v.articles ? v.articles.map(a => a.produitNom).join(', ') : v.produitNom}</p>
        <p>${v.client} · ${formaterDate(v.date)}</p>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
        <span class="vente-montant">+${v.total.toLocaleString()} F</span>
        <button onclick="supprimerVente(${v.id})" style="background:none; border:none; font-size:16px; cursor:pointer;">🗑</button>
      </div>
    </div>
  `).join('');
}

// ========== ACCUEIL ==========

function afficherDernieresVentes() {
  const liste = document.getElementById('dernières-ventes');
  if (!liste) return;

  const ventes = getVentes().slice(0, 5);
  if (ventes.length === 0) {
    liste.innerHTML = '<p class="vide">Aucune vente enregistrée</p>';
    return;
  }

  liste.innerHTML = `<div class="ventes-liste">${ventes.map(v => `
    <div class="vente-item">
      <div class="vente-info">
        <p>${v.articles ? v.articles.map(a => a.produitNom).join(', ') : v.produitNom}</p>
        <p>${v.client} · ${formaterDate(v.date)}</p>
      </div>
      <span class="vente-montant">+${v.total.toLocaleString()} F</span>
    </div>
  `).join('')}</div>`;
}

function calculerStats() {
  const venteJourEl = document.getElementById('ventes-jour');
  const venteMoisEl = document.getElementById('ventes-mois');
  if (!venteJourEl || !venteMoisEl) return;

  const ventes = getVentes();
  const now = new Date();

  const totalJour = ventes
    .filter(v => new Date(v.date).toDateString() === now.toDateString())
    .reduce((sum, v) => sum + v.total, 0);

  const totalMois = ventes
    .filter(v => {
      const d = new Date(v.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, v) => sum + v.total, 0);

  venteJourEl.textContent = totalJour.toLocaleString() + ' F';
  venteMoisEl.textContent = totalMois.toLocaleString() + ' F';
}

// ========== FACTURES ==========

let factureEnCours = null;
function genererPDFDepuisVente(id) {
  const vente = getVentes().find(v => v.id === id);
  if (!vente) return;

  const numero = 'FAC-' + vente.id.toString().slice(-6);
  const date = new Date(vente.date).toLocaleDateString('fr-FR');
  const articles = vente.articles || [{
    produitNom: vente.produitNom,
    prix: vente.prix,
    quantite: vente.quantite,
    total: vente.total
  }];

  const factures = getFactures();
  const existe = factures.find(f => f.venteId === vente.id);
  if (!existe) {
    factures.unshift({
      id: Date.now(),
      venteId: vente.id,
      numero,
      client: vente.client,
      produitNom: articles.map(a => a.produitNom).join(', '),
      total: vente.total,
      date: vente.date
    });
    saveFactures(factures);
  }

  factureEnCours = { vente, articles, numero, date };

  document.getElementById('modal-numero').textContent = 'N° ' + numero;
  document.getElementById('modal-date').textContent = 'Date : ' + date;
  document.getElementById('modal-client').textContent = 'Client : ' + vente.client;
  document.getElementById('modal-lignes').innerHTML = articles.map(a => `
    <tr>
      <td>${a.produitNom}</td>
      <td>${a.quantite}</td>
      <td>${a.prix.toLocaleString()} F</td>
      <td>${a.total.toLocaleString()} F</td>
    </tr>
  `).join('');
  document.getElementById('modal-total').textContent = vente.total.toLocaleString() + ' F CFA';

  document.getElementById('modal-overlay').style.display = 'flex';
}
function fermerModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  factureEnCours = null;
}

function telechargerDepuisModal() {
  if (!factureEnCours) return;
  const { vente, articles, numero, date } = factureEnCours;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFillColor(192, 38, 211);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Parfums by Bousso', 14, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Vente de parfums de qualité', 14, 24);
  doc.text('Touba, Sénégal', 14, 30);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.text('FACTURE', 14, 48);
  doc.setFontSize(10);
  doc.text('N° : ' + numero, 14, 56);
  doc.text('Date : ' + date, 14, 63);
  doc.text('Client : ' + vente.client, 14, 70);

  doc.setDrawColor(192, 38, 211);
  doc.setLineWidth(0.5);
  doc.line(14, 75, 196, 75);

  doc.setFillColor(245, 245, 245);
  doc.rect(14, 78, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Produit', 16, 84);
  doc.text('Qté', 110, 84);
  doc.text('Prix unitaire', 130, 84);
  doc.text('Total', 172, 84);

  doc.setFont('helvetica', 'normal');
  let y = 96;
  articles.forEach((a, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(252, 232, 255);
      doc.rect(14, y - 5, 182, 8, 'F');
    }
    doc.text(a.produitNom, 16, y);
    doc.text(String(a.quantite), 112, y);
    doc.text(a.prix.toLocaleString() + ' F', 130, y);
    doc.text(a.total.toLocaleString() + ' F', 172, y);
    y += 10;
  });

  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL : ' + vente.total.toLocaleString() + ' F CFA', 130, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Merci pour votre achat ! — Parfums by Bousso', 14, 280);

  doc.save('facture-' + numero + '.pdf');
}

function afficherListeFactures() {
  const liste = document.getElementById('liste-factures');
  if (!liste) return;

  const factures = getFactures();
  if (factures.length === 0) {
    liste.innerHTML = '<p class="vide">Aucune facture générée</p>';
    return;
  }

  liste.innerHTML = factures.map(f => `
    <div class="vente-item" onclick="ouvrirFacture(${f.venteId})" style="cursor:pointer;">
      <div class="vente-info">
        <p>${f.numero} — ${f.produitNom}</p>
        <p>${f.client} · ${formaterDate(f.date)}</p>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
        <span class="vente-montant">${f.total.toLocaleString()} F</span>
        <span style="font-size:10px; color:#c026d3;">👁 Voir</span>
      </div>
    </div>
  `).join('');
}

function ouvrirFacture(venteId) {
  genererPDFDepuisVente(venteId);
}

// ========== RAPPORT ==========

function getNomMois(date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function chargerRapport() {
  const ventes = getVentes();
  const now = new Date();

  const moisActuel = ventes.filter(v => {
    const d = new Date(v.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const moisPrecedentDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const moisPrecedent = ventes.filter(v => {
    const d = new Date(v.date);
    return d.getMonth() === moisPrecedentDate.getMonth() &&
           d.getFullYear() === moisPrecedentDate.getFullYear();
  });

  const totalActuel = moisActuel.reduce((s, v) => s + v.total, 0);
  const totalPrecedent = moisPrecedent.reduce((s, v) => s + v.total, 0);

  const labelActuel = document.getElementById('label-mois-actuel');
  const labelPrecedent = document.getElementById('label-mois-precedent');
  const totalActuelEl = document.getElementById('total-mois-actuel');
  const totalPrecedentEl = document.getElementById('total-mois-precedent');

  if (!labelActuel) return;

  labelActuel.textContent = getNomMois(now);
  labelPrecedent.textContent = getNomMois(moisPrecedentDate);
  totalActuelEl.textContent = totalActuel.toLocaleString() + ' F';
  totalPrecedentEl.textContent = totalPrecedent.toLocaleString() + ' F';

  const msg = document.getElementById('comparaison-message');
  if (msg) {
    if (totalPrecedent === 0) {
      msg.textContent = '';
    } else if (totalActuel > totalPrecedent) {
      const diff = Math.round(((totalActuel - totalPrecedent) / totalPrecedent) * 100);
      msg.innerHTML = `<span style="color:#16a34a;">📈 +${diff}% par rapport au mois dernier</span>`;
    } else if (totalActuel < totalPrecedent) {
      const diff = Math.round(((totalPrecedent - totalActuel) / totalPrecedent) * 100);
      msg.innerHTML = `<span style="color:#dc2626;">📉 -${diff}% par rapport au mois dernier</span>`;
    } else {
      msg.innerHTML = `<span style="color:#64748b;">= Même niveau que le mois dernier</span>`;
    }
  }

  const parMois = {};
  ventes.forEach(v => {
    const d = new Date(v.date);
    const cle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = getNomMois(d);
    if (!parMois[cle]) parMois[cle] = { label, total: 0, count: 0 };
    parMois[cle].total += v.total;
    parMois[cle].count++;
  });

  const moisTries = Object.keys(parMois).sort().reverse();
  const historiqueDiv = document.getElementById('historique-mois');

  if (historiqueDiv) {
    if (moisTries.length === 0) {
      historiqueDiv.innerHTML = '<p class="vide">Aucune donnée</p>';
    } else {
      const maxTotal = Math.max(...moisTries.map(k => parMois[k].total));
      historiqueDiv.innerHTML = moisTries.map(k => {
        const m = parMois[k];
        const pct = Math.round((m.total / maxTotal) * 100);
        return `
          <div class="mois-item">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
              <span style="font-size:13px; font-weight:500; text-transform:capitalize;">${m.label}</span>
              <span style="font-size:13px; font-weight:600; color:#c026d3;">${m.total.toLocaleString()} F</span>
            </div>
            <div class="barre-bg">
              <div class="barre-fill" style="width:${pct}%;"></div>
            </div>
            <p style="font-size:11px; color:#999; margin-top:3px;">${m.count} vente(s)</p>
          </div>
        `;
      }).join('');
    }
  }

  const parProduit = {};
  ventes.forEach(v => {
    const articles = v.articles || [{ produitNom: v.produitNom, quantite: v.quantite, total: v.total }];
    articles.forEach(a => {
      if (!parProduit[a.produitNom]) parProduit[a.produitNom] = { quantite: 0, total: 0 };
      parProduit[a.produitNom].quantite += a.quantite;
      parProduit[a.produitNom].total += a.total;
    });
  });

  const topProduits = Object.entries(parProduit)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5);

  const topDiv = document.getElementById('top-produits');
  if (topDiv) {
    if (topProduits.length === 0) {
      topDiv.innerHTML = '<p class="vide">Aucune donnée</p>';
    } else {
      topDiv.innerHTML = topProduits.map(([nom, data], i) => `
        <div class="top-item">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="top-rang">${i + 1}</span>
            <div>
              <p style="font-size:13px; font-weight:500;">${nom}</p>
              <p style="font-size:11px; color:#999;">${data.quantite} unité(s) vendue(s)</p>
            </div>
          </div>
          <span style="font-size:13px; font-weight:600; color:#c026d3;">${data.total.toLocaleString()} F</span>
        </div>
      `).join('');
    }
  }
}
function filtrerProduits() {
  const query = document.getElementById('recherche-produit').value.trim().toLowerCase();
  const select = document.getElementById('produit-vente');
  const produits = getProduits();

  select.innerHTML = '<option value="">-- Choisir un parfum --</option>';

  const filtres = query
    ? produits.filter(p => p.nom.toLowerCase().includes(query))
    : produits;

  filtres.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.nom} — ${p.prix.toLocaleString()} F CFA (stock: ${p.stock})</option>`;
  });
}

function afficherAlertes() {
  const sectionAlertes = document.getElementById('section-alertes');
  const divAlertes = document.getElementById('alertes-stock');
  if (!sectionAlertes || !divAlertes) return;

  const produits = getProduits();
  const stockMin = 3; // alerte si stock <= 3
  const alertes = produits.filter(p => p.stock <= stockMin);

  if (alertes.length === 0) {
    sectionAlertes.style.display = 'none';
    return;
  }

  sectionAlertes.style.display = 'block';
  divAlertes.innerHTML = alertes.map(p => `
    <div class="alerte-item ${p.stock === 0 ? 'alerte-rupture' : 'alerte-bas'}">
      <div>
        <p style="font-size:13px; font-weight:500;">${p.nom}</p>
        <p style="font-size:11px; margin-top:2px;">
          ${p.stock === 0 ? 'Rupture de stock !' : `Plus que ${p.stock} unité(s) !`}
        </p>
      </div>
      <a href="produits.html" style="font-size:11px; color:#c026d3; text-decoration:none;">Réappro →</a>
    </div>
  `).join('');
}
function afficherMessage(texte) {
  const msg = document.createElement('div');
  msg.textContent = texte;
  msg.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: #16a34a;
    color: white;
    padding: 12px 24px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    z-index: 9999;
  `;
  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 2500);
}

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', () => {
  afficherProduits();
  afficherDernieresVentes();
  afficherHistoriqueVentes();
  afficherListeFactures();
  calculerStats();
  chargerSelectProduits();
  chargerRapport();
  afficherAlertes();
});
