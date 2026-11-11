/* Bounded portable image imports are included in JSON exports. */
const LocalArt = {
    choose(field) {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/png,image/jpeg,image/webp';
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;
            let bitmap;
            try {
                if (file.size > 20 * 1024 * 1024) throw new Error('请选择小于 20 MB 的图片');
                bitmap = await createImageBitmap(file);
                const canvas = document.createElement('canvas');
                const scale = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height));
                canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                let value = canvas.toDataURL('image/jpeg', .85);
                if (value.length > 220000) value = canvas.toDataURL('image/jpeg', .55);
                if (value.length > 220000) throw new Error('请缩小图片后导入');
                field.value = value;
                field.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (error) { alert(error.message || '无法读取图片'); }
            finally { bitmap?.close(); }
        };
        input.click();
    },
    init() {
        for (const id of ['editCover', 'coverHYP', 'coverWMS', 'catCover']) {
            const field = document.getElementById(id);
            if (!field) continue;
            field.placeholder = 'https://… 或 assets/jackets/图片.jpg';
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'btn-outline local-art-button';
            button.textContent = '选择本地图片';
            button.onclick = () => { if (!field.disabled) this.choose(field); };
            field.insertAdjacentElement('afterend', button);
            field.addEventListener('change', () => {
                if (/^(?:file:|[a-z]:[\\/])/i.test(field.value.trim()) && !Utils.assetURL(field.value)) alert('项目外的磁盘路径不能由网页直接读取。请点“选择本地图片”，或将图片放进项目 assets 文件夹并填写相对路径。');
            });
        }
    }
};
