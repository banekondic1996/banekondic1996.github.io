// Crypto utilities for blog decryption
class BlogCrypto {
    constructor() {
        this.algorithm = 'AES-GCM';
    }

    str2ab(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    ab2str(buffer) {
        const decoder = new TextDecoder();
        return decoder.decode(buffer);
    }

    ab2base64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    base642ab(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async deriveKey(password, salt) {
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            this.str2ab(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: this.algorithm, length: 256 },
            false,
            ['decrypt']
        );
    }

    async decrypt(encryptedData, password) {
        try {
            const salt = this.base642ab(encryptedData.salt);
            const iv = this.base642ab(encryptedData.iv);
            const encrypted = this.base642ab(encryptedData.encrypted);
            const key = await this.deriveKey(password, salt);

            const decrypted = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                key,
                encrypted
            );

            return this.ab2str(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Incorrect password or corrupted data');
        }
    }
}

const blogCrypto = new BlogCrypto();