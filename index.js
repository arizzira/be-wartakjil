require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Konfigurasi CORS supaya ga diblokir Vercel
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/', (req, res) => res.send('🔥 API War Takjil Ready!'));

// ENDPOINT VOTE (Sudah diperbaiki agar balikin Array)
app.post('/api/vote', async (req, res) => {
  const { team, count } = req.body;

  if (!['muslim', 'nonis'].includes(team) || !count) {
    return res.status(400).json({ error: 'Data ga valid bang' });
  }

  try {
    // 1. Update skor di Supabase
    const { error: rpcError } = await supabase.rpc('update_score', { 
      team_arg: team, 
      points: count 
    });

    if (rpcError) throw rpcError;

    // 2. Ambil semua data skor terbaru (PENTING: Biar .find() di frontend jalan)
    const { data: updatedScores, error: fetchError } = await supabase
      .from('scores')
      .select('team_name, score');

    if (fetchError) throw fetchError;

    // Balikin data dalam bentuk ARRAY
    return res.json(updatedScores);
  } catch (error) {
    console.error("Error pas vote:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/scores', async (req, res) => {
  const { data, error } = await supabase
    .from('scores')
    .select('team_name, score');

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// Setting buat Vercel Serverless
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
}

module.exports = app;