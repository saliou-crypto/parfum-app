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

function formaterDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
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
  produits.push({ id: Date.now(), nom, prix, stock });
  saveProduits(produits);

  document.getElementById('nom-produit').value = '';
  document.getElementById('prix-produit').value = '';
  document.getElementById('stock-produit').value = '';

  afficherProduits();
}

function supprimerProduit(id) {
  let produits = getProduits().filter(p => p.id !== id);
  saveProduits(produits);
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
      <div class="produit-icon">🌸</div>
      <div class="produit-info">
        <p>${p.nom}</p>
        <p>${p.prix.toLocaleString()} F CFA · Stock: ${p.stock}</p>
      </div>
      <button class="btn-supprimer" onclick="supprimerProduit(${p.id})">🗑</button>
    </div>
  `).join('');
}

// ========== VENTES ==========

function chargerSelectProduits() {
  const select = document.getElementById('produit-vente');
  if (!select) return;

  const produits = getProduits();
  select.innerHTML = '<option value="">-- Choisir un parfum --</option>';
  produits.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.nom} — ${p.prix.toLocaleString()} F CFA (stock: ${p.stock})</option>`;
  });

  select.addEventListener('change', calculerTotal);
  document.getElementById('quantite-vente')?.addEventListener('input', calculerTotal);
}

function calculerTotal() {
  const selectEl = document.getElementById('produit-vente');
  const qte = parseInt(document.getElementById('quantite-vente').value) || 0;
  const produits = getProduits();
  const produit = produits.find(p => p.id == selectEl.value);
  const total = produit ? produit.prix * qte : 0;
  document.getElementById('total-vente').textContent = total.toLocaleString() + ' F CFA';
}

function enregistrerVente() {
  const selectEl = document.getElementById('produit-vente');
  const qte = parseInt(document.getElementById('quantite-vente').value);
  const client = document.getElementById('client-vente').value.trim();

  if (!selectEl.value || !qte || qte <= 0) {
    alert('Choisis un produit et une quantité valide !');
    return;
  }

  let produits = getProduits();
  const produit = produits.find(p => p.id == selectEl.value);

  if (!produit) return;

  if (qte > produit.stock) {
    alert(`Stock insuffisant ! Il reste seulement ${produit.stock} unité(s).`);
    return;
  }

  produit.stock -= qte;
  saveProduits(produits);

  const ventes = getVentes();
  ventes.unshift({
    id: Date.now(),
    produitId: produit.id,
    produitNom: produit.nom,
    prix: produit.prix,
    quantite: qte,
    total: produit.prix * qte,
    client: client || 'Client anonyme',
    date: Date.now()
  });
  saveVentes(ventes);

  alert('Vente enregistrée ! ✅');

  selectEl.value = '';
  document.getElementById('quantite-vente').value = '';
  document.getElementById('client-vente').value = '';
  document.getElementById('total-vente').textContent = '0 F CFA';

  afficherHistoriqueVentes();
  chargerSelectProduits();
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
      <div class="vente-info">
        <p>${v.produitNom} x${v.quantite}</p>
        <p>${v.client} · ${formaterDate(v.date)}</p>
      </div>
      <span class="vente-montant">+${v.total.toLocaleString()} F</span>
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
        <p>${v.produitNom} x${v.quantite}</p>
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

let lignesFacture = [];

function getFactures() {
  return JSON.parse(localStorage.getItem('factures')) || [];
}

function saveFactures(factures) {
  localStorage.setItem('factures', JSON.stringify(factures));
}

function chargerSelectFacture() {
  const select = document.getElementById('facture-produit');
  if (!select) return;

  const produits = getProduits();
  select.innerHTML = '<option value="">-- Choisir un parfum --</option>';
  produits.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.nom} — ${p.prix.toLocaleString()} F CFA</option>`;
  });
}

function ajouterLigneFacture() {
  const client = document.getElementById('facture-client').value.trim();
  const telephone = document.getElementById('facture-telephone').value.trim();
  const selectEl = document.getElementById('facture-produit');
  const qte = parseInt(document.getElementById('facture-quantite').value);

  if (!client) { alert('Entre le nom du client !'); return; }
  if (!selectEl.value || !qte || qte <= 0) {
    alert('Choisis un produit et une quantité !');
    return;
  }

  const produits = getProduits();
  const produit = produits.find(p => p.id == selectEl.value);
  if (!produit) return;

  lignesFacture.push({
    nom: produit.nom,
    prix: produit.prix,
    quantite: qte,
    total: produit.prix * qte
  });

  selectEl.value = '';
  document.getElementById('facture-quantite').value = '';

  afficherApercuFacture(client, telephone);
}

function afficherApercuFacture(client, telephone) {
  const section = document.getElementById('apercu-section');
  section.style.display = 'block';

  const numero = 'FAC-' + Date.now().toString().slice(-6);
  const date = new Date().toLocaleDateString('fr-FR');

  document.getElementById('facture-numero').textContent = 'N° ' + numero;
  document.getElementById('facture-date').textContent = 'Date : ' + date;
  document.getElementById('apercu-client').textContent =
    'Client : ' + client + (telephone ? ' · ' + telephone : '');

  const tbody = document.getElementById('facture-lignes');
  tbody.innerHTML = lignesFacture.map(l => `
    <tr>
      <td>${l.nom}</td>
      <td>${l.quantite}</td>
      <td>${l.prix.toLocaleString()} F</td>
      <td>${l.total.toLocaleString()} F</td>
    </tr>
  `).join('');

  const totalGeneral = lignesFacture.reduce((s, l) => s + l.total, 0);
  document.getElementById('facture-total-montant').textContent =
    totalGeneral.toLocaleString() + ' F CFA';
}

function genererPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const client = document.getElementById('facture-client').value.trim();
  const telephone = document.getElementById('facture-telephone').value.trim();
  const numero = 'FAC-' + Date.now().toString().slice(-6);
  const date = new Date().toLocaleDateString('fr-FR');

  // En-tête
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

  // Infos facture
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.text('FACTURE', 14, 48);
  doc.setFontSize(10);
  doc.text('N° : ' + numero, 14, 56);
  doc.text('Date : ' + date, 14, 63);
  doc.text('Client : ' + client + (telephone ? ' — ' + telephone : ''), 14, 70);

  // Ligne séparatrice
  doc.setDrawColor(192, 38, 211);
  doc.setLineWidth(0.5);
  doc.line(14, 75, 196, 75);

  // Tableau
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
  lignesFacture.forEach((l, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(252, 232, 255);
      doc.rect(14, y - 5, 182, 8, 'F');
    }
    doc.text(l.nom, 16, y);
    doc.text(String(l.quantite), 112, y);
    doc.text(l.prix.toLocaleString() + ' F', 130, y);
    doc.text(l.total.toLocaleString() + ' F', 172, y);
    y += 10;
  });

  // Total
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const totalGeneral = lignesFacture.reduce((s, l) => s + l.total, 0);
  doc.text('TOTAL : ' + totalGeneral.toLocaleString() + ' F CFA', 130, y);

  // Pied de page
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Merci pour votre achat ! — Parfums by Bousso', 14, 280);

  // Sauvegarder dans l'historique
  const factures = getFactures();
  factures.unshift({
    id: Date.now(),
    numero,
    client,
    total: totalGeneral,
    date: Date.now()
  });
  saveFactures(factures);
  afficherHistoriqueFactures();

  doc.save('facture-' + numero + '.pdf');
}

function reinitialiserFacture() {
  lignesFacture = [];
  document.getElementById('facture-client').value = '';
  document.getElementById('facture-telephone').value = '';
  document.getElementById('apercu-section').style.display = 'none';
  chargerSelectFacture();
}

function afficherHistoriqueFactures() {
  const liste = document.getElementById('historique-factures');
  if (!liste) return;

  const factures = getFactures();
  if (factures.length === 0) {
    liste.innerHTML = '<p class="vide">Aucune facture générée</p>';
    return;
  }

  liste.innerHTML = factures.map(f => `
    <div class="vente-item">
      <div class="vente-info">
        <p>${f.numero}</p>
        <p>${f.client} · ${formaterDate(f.date)}</p>
      </div>
      <span class="vente-montant">${f.total.toLocaleString()} F</span>
    </div>
  `).join('');
}

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', () => {
  afficherProduits();
  afficherDernieresVentes();
  afficherHistoriqueVentes();
  afficherHistoriqueFactures();
  calculerStats();
  chargerSelectProduits();
  chargerSelectFacture();
});