
const txline = process.env.TXLINE_ORIGIN

export async function activate(req, res) {
  const { txSig, walletSignature, leagues, jwt } = req.body;
  try {
    const r = await fetch(`${txline}/api/token/activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ txSig, walletSignature, leagues: leagues ?? [] }),
    });

    // TxLINE returns the API token as a BARE STRING ("txoracle_api_..."), not
    // JSON — so r.json() throws. Read the body as text and only treat it as JSON
    // if it actually parses.
    const text = (await r.text()).trim();

    let token = null;
    try {
      const data = JSON.parse(text);
      token = data?.token ?? data?.apiToken ?? null;
      if (!token) {
        return res.status(r.ok ? 502 : r.status).json({ error: "no token from TxLINE", data });
      }
    } catch {
      // Not JSON: the body IS the token (or an upstream error string).
      if (!r.ok) return res.status(r.status).json({ error: text || `TxLINE ${r.status}` });
      token = text;
    }

    if (!token) return res.status(502).json({ error: "empty token from TxLINE" });
    res.json({ token });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
