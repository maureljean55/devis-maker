import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mrsazbacreacaqoaobve.supabase.co";
const SUPABASE_KEY = "sb_publishable_EcH_nHyspxclVVhcA5pc2g_XB-9WomJ";

const admins = [
  { email: "Taleyvital00@gmail.com", password: "000000", nom: "Vital" },
  { email: "Tuttolegn00@gmail.com",  password: "000000", nom: "Mr Sylla" },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

for (const admin of admins) {
  const { data, error } = await supabase.auth.signUp({
    email:    admin.email,
    password: admin.password,
    options:  { data: { nom: admin.nom } },
  });

  if (error) {
    console.error(`✗ ${admin.email} :`, error.message);
  } else {
    console.log(`✓ ${admin.nom} (${admin.email}) — id: ${data.user?.id ?? "à confirmer"}`);
  }
}
