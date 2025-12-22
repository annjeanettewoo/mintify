function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Buffer.from(str, 'base64').toString('utf8');
}

const token = process.argv[2];
if (!token) {
    console.error('Usage: node decodeToken.js <JWT>');
    process.exit(1);
}

const parts = token.split('.');
if (parts.length !== 3) {
    console.error('Not a JWT');
    process.exit(1);
}

const header = JSON.parse(base64urlDecode(parts[0]));
const payload = JSON.parse(base64urlDecode(parts[1]));

console.log('HEADER:', header);
console.log('PAYLOAD:', payload);
