require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({
  origin: '*' // Sementara pake bintang dulu biar ga ribet, nanti bisa diganti URL frontend
}));

app.use(express.json());

// Koneksi ke Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/', (req, res) => res.send('🔥 API War Takjil Ready!'));

// Endpoint Update Skor - SEKARANG MENGEMBALIKAN DATA TERBARU
app.post('/api/vote', async (req, res) => {
  const { team, count } = req.body;

  if (!['muslim', 'nonis'].includes(team) || !count) {
    return res.status(400).json({ error: 'Data ga valid bang' });
  }

  try {
    // 1. Panggil RPC untuk update skor
    const { error: rpcError } = await supabase.rpc('update_score', { 
      team_arg: team, 
      points: count 
    });

    if (rpcError) throw rpcError;

    // 2. AMBIL DATA TERBARU LANGSUNG (Kunci biar ga jitter)
    const { data: updatedScores, error: fetchError } = await supabase
      .from('scores')
      .select('team_name, score');

    if (fetchError) throw fetchError;

    // 3. Kembalikan data skor terbaru ke frontend
    return res.json(updatedScores);
  } catch (error) {
    console.error("Error pas vote:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint Ambil Skor Terkini
app.get('/api/scores', async (req, res) => {
  const { data, error } = await supabase
    .from('scores')
    .select('team_name, score');

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server lokal jalan di port ${PORT}`));
}

// WAJIB ADA INI buat Vercel:
module.exports = app;