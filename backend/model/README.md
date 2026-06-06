# Place the trained model here

After training in Google Colab and downloading `finbert-finetuned.zip`, unzip it
and copy its **contents** directly into this folder, so it looks like:

```
backend/model/
├── config.json
├── model.safetensors        (or pytorch_model.bin)
├── tokenizer.json
├── tokenizer_config.json
├── special_tokens_map.json
└── vocab.txt
```

The backend auto-detects the model on startup (`GET /` reports `model_loaded`).
No code changes needed — just drop the files in and restart the server.
