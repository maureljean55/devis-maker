import { DevisData } from "@/lib/types";

interface DevisDocProps {
  devis: DevisData;
  docId?: string;
}

function fmt(n: number | string | ""): string {
  const num = parseFloat(String(n)) || 0;
  if (num === 0) return "";
  // Séparateur de milliers avec point (ex: 455.000)
  return num.toLocaleString("fr-FR").replace(/ | | /g, ".");
}

function formatDate(d: string): string {
  if (!d) return "__ ______ ____";
  const [y, m, day] = d.split("-");
  const mois = [
    "janvier","février","mars","avril","mai","juin",
    "juillet","août","septembre","octobre","novembre","décembre",
  ];
  return `${parseInt(day)} ${mois[parseInt(m) - 1]} ${y}`;
}

export default function DevisDoc({ devis, docId = "doc-preview" }: DevisDocProps) {
  const totalMat = devis.lignes.reduce(
    (acc, l) => acc + (parseFloat(String(l.montant)) || 0),
    0
  );
  const mo = parseFloat(String(devis.main_oeuvre)) || 0;
  const total = totalMat + mo;

  const num = "536HG/SC";
  const dateStr = formatDate(devis.date_devis);
  // "2026-06-05" → "05/06/2026"
  const dateDisplay = devis.date_devis
    ? devis.date_devis.split("-").reverse().join("/")
    : "";

  const tdStyle: React.CSSProperties = {
    border: "1px solid #111",
    padding: "7px 8px",
    verticalAlign: "middle",
  };

  return (
    <div
      id={docId}
      style={{
        background: "#fff",
        color: "#111",
        fontFamily: "Arial, sans-serif",
        fontSize: "12px",
        padding: "40px",
        boxShadow: "0 4px 40px rgba(0,0,0,.15)",
        minHeight: "900px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        {/* Colonne gauche : logo + texte entreprise */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", flexShrink: 0, maxWidth: "230px" }}>
          <div
            style={{
              width: "110px",
              height: "95px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Tutto Legno" style={{ width: "110px", height: "95px", objectFit: "contain" }} />
          </div>
          <div
            style={{
              fontStyle: "italic",
              fontWeight: "bold",
              fontSize: "10px",
              lineHeight: 1.6,
              marginTop: "10px",
              textTransform: "uppercase",
              textAlign: "left",
              color: "#b8892a",
            }}
          >
            <span style={{ color: "#b8892a" }}>
              Menuiserie Industrielle et la Décoration
              <br />
              Intérieur
            </span>
            <br />
            <span style={{ color: "#111" }}>
              Facture Pro-Forma N°{num}
              <br />
              TUTTO LEGNO/ {dateDisplay}
            </span>
          </div>
        </div>

        {/* Colonne droite : date en grand + boîte client */}
        <div style={{ textAlign: "center", maxWidth: "340px", fontSize: "11px", flex: 1, paddingLeft: "24px" }}>
          <div
            style={{
              fontSize: "22px",
              fontWeight: "400",
              marginBottom: "20px",
              color: "#111",
              textAlign: "center",
            }}
          >
            Abidjan, le {dateStr}
          </div>
          <div
            style={{
              border: "1.5px solid #111",
              padding: "8px 12px",
              fontSize: "11px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontWeight: "bold",
                fontSize: "11px",
                marginBottom: "6px",
                paddingBottom: "4px",
                borderBottom: "1px solid #111",
              }}
            >
              REFERENCE DU CLIENT
            </div>
            <div>
              <strong>RAISON SOCIAL:</strong> {devis.client_nom || "___"}
            </div>
            <div>
              <strong>CONTACT:</strong> {devis.client_contact || "___"}
            </div>
            <div>
              <strong>OBJET</strong> : {devis.client_objet || "___"}
            </div>
          </div>
        </div>
      </div>

      {/* Table title */}
      <div
        style={{
          textAlign: "center",
          fontWeight: "bold",
          fontSize: "12px",
          border: "1.5px solid #111",
          padding: "7px",
          margin: "18px 0 0",
          textTransform: "uppercase",
        }}
      >
        {devis.titre_travaux || "NATURE DES TRAVAUX"}
      </div>

      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "11px",
          marginTop: 0,
        }}
      >
        <thead>
          <tr>
            {(["N°", "DESIGNATIONS", "UNITAIRE", "QUANTITE", "MONTANT"] as const).map(
              (h, i) => (
                <th
                  key={h}
                  style={{
                    border: "1px solid #111",
                    padding: "6px 8px",
                    fontWeight: "bold",
                    textAlign: "center",
                    background: "#fff",
                    width: ["6%", "44%", "14%", "14%", "22%"][i],
                  }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {(() => {
            let secCount = 0;
            return devis.lignes.map((l) => {
              if (l.type === "section") {
                secCount++;
                return (
                  <tr key={l.id}>
                    <td style={{ ...tdStyle, textAlign: "center", fontWeight: "bold", fontStyle: "italic" }}>
                      A{secCount}
                    </td>
                    <td
                      colSpan={4}
                      style={{ ...tdStyle, fontWeight: "bold", fontStyle: "italic" }}
                    >
                      {l.designation}
                    </td>
                  </tr>
                );
              }
              // item
              const hasContent = l.designation || l.unitaire || l.qte || l.montant;
              if (!hasContent && devis.lignes.length > 1) return null;
              return (
                <tr key={l.id}>
                  <td style={{ ...tdStyle, textAlign: "center" }} />
                  <td style={{ ...tdStyle, paddingLeft: "20px" }}>{l.designation}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{fmt(l.unitaire)}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{l.qte || ""}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{fmt(l.montant)}</td>
                </tr>
              );
            });
          })()}
          {[
            { label: "TOTAL MATERIELS", value: fmt(totalMat) },
            ...(mo > 0 ? [{ label: "MAIN D'ŒUVRE", value: fmt(mo) }] : []),
            { label: "TOTAL HT", value: fmt(total) },
          ].map((row) => (
            <tr key={row.label}>
              <td
                colSpan={4}
                style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#8B0000" }}
              >
                {row.label}
              </td>
              <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold", color: "#8B0000" }}>
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ marginTop: "28px" }}>
        <div
          style={{ fontWeight: "bold", fontSize: "13px", marginBottom: "12px" }}
        >
          Arrêté le Présent Devis à la somme de :{" "}
          {devis.montant_lettres || "___"}{" "}
          <em style={{ fontWeight: "normal" }}>Franc CFA</em>
        </div>
        <div
          style={{
            fontStyle: "italic",
            fontSize: "11px",
            marginBottom: "14px",
            lineHeight: 1.7,
          }}
        >
          <strong>NB</strong> : Le Devis est de nature indicative, peut être
          réviser à la baisse ou à la hausse, suivant d&apos;éventuel modification
          par réduction quantitative et le coût de matière d&apos;œuvre qui peuvent
          survenir sur le marché au cours de la commande avant ou après 3 mois de
          validation de celui-ci au démarrage des travaux.
        </div>
        <div style={{ fontStyle: "italic", fontSize: "11px", lineHeight: 1.8 }}>
          <strong>CONDITIONS PARTICULIERES</strong> : Une avance de démarrage de{" "}
          <strong>{devis.avance_pct}%</strong> du marché conclu est exigée à la
          commande.
          <br />
          La suite du paiement par situation selon le volume de livraison et le
          solde à la fin de la dernière livraison.
        </div>
        {/* BON POUR ACCORD / LA COMPTABILITE */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "28px",
            marginBottom: "32px",
          }}
        >
          <div style={{ textDecoration: "underline", fontWeight: "bold", fontSize: "12px" }}>
            BON POUR ACCORD
          </div>
          <div style={{ textDecoration: "underline", fontWeight: "bold", fontSize: "12px" }}>
            LA COMPTABILITE
          </div>
        </div>

        {/* Contacts */}
        <div
          style={{
            fontWeight: "bold",
            fontSize: "11px",
            lineHeight: 1.7,
            textAlign: "center",
          }}
        >
          <div style={{ color: "#111" }}>
            TUTTO LEGNO MENUISERIE INDUSTRIELLE SARL — ABIDJAN, COCODY ABATTA CITÉ BCEAO EN BAS, LOT : 116, ÎLOT : 10
          </div>
          <div>
            <span style={{ color: "#cc2200" }}>
              07 07 55 35 45 – 05 04 53 59 53
            </span>
            <span style={{ color: "#111" }}>
              {" "}— N° IDENTIFICATION : CI-2025-0042790P
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
