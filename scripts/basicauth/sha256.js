const hex = (buffer) => {
  let digest = '';
  const view = new DataView(buffer);
  for (let i = 0; i < view.byteLength; i += 4) {
    const value = view.getUint32(i);
    const stringValue = value.toString(16);
    const padding = '00000000';
    const paddedValue = (padding + stringValue).slice(-padding.length);
    digest += paddedValue;
  }

  return digest;
};

const SHA256 = {
  hash: (value) => {
    const buffer = new TextEncoder('utf-8').encode(value);
    return crypto.subtle.digest('SHA-256', buffer).then((hash) => hex(hash));
  },
};

export default SHA256;
