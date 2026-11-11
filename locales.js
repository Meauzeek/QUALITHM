/* Interface copy only. Catalog titles, artists and difficulty codes stay original.
   Inuktitut is an initial translation and still needs a fluent speaker's review. */
(() => {
    const keys = 'archive|archives|settings|exit|back|language|theme|light|dark|mute|motion|done|ended|resume|search|batch|add|close|library|closeLibrary'.split('|');
    const rows = {
        en: 'MUSIC ARCHIVE|MUSIC ARCHIVES|SETTINGS|EXIT|RETURN|LANGUAGE|APPEARANCE|LIGHT|DARK|MUTE PREVIEWS|REDUCE MOTION|DONE|SESSION ENDED|RETURN TO TITLE|SEARCH...|Batch edit songs|Add song|Close settings|SONGS|Close song list',
        zh: '进入曲库|曲包选择|设置|退出|返回|界面语言|外观|日间|夜间|试听静音|减少动态效果|完成|本次会话已退出|返回标题页|搜索曲目…|批量编辑曲目|新增曲目|关闭设置|选曲目录|关闭选曲目录',
        'zh-Hant': '進入曲庫|曲包選擇|設定|退出|返回|介面語言|外觀|日間|夜間|試聽靜音|減少動態效果|完成|本次工作階段已結束|返回標題頁|搜尋曲目…|批次編輯曲目|新增曲目|關閉設定|選曲目錄|關閉選曲目錄',
        fr: 'BIBLIOTHÈQUE|COLLECTIONS|PARAMÈTRES|QUITTER|RETOUR|LANGUE|APPARENCE|CLAIR|SOMBRE|COUPER LES EXTRAITS|RÉDUIRE LES ANIMATIONS|TERMINÉ|SESSION TERMINÉE|RETOUR À L’ACCUEIL|RECHERCHER…|Modifier plusieurs morceaux|Ajouter un morceau|Fermer les paramètres|MORCEAUX|Fermer la liste',
        ja: '楽曲ライブラリ|楽曲パック|設定|終了|戻る|表示言語|外観|ライト|ダーク|プレビューをミュート|動きを減らす|完了|セッションが終了しました|タイトルへ戻る|楽曲を検索…|楽曲を一括編集|楽曲を追加|設定を閉じる|楽曲一覧|楽曲一覧を閉じる',
        ko: '음악 라이브러리|곡 팩 선택|설정|종료|뒤로|표시 언어|화면 모드|라이트|다크|미리 듣기 음소거|동작 줄이기|완료|세션이 종료되었습니다|타이틀로 돌아가기|곡 검색…|곡 일괄 편집|곡 추가|설정 닫기|곡 목록|곡 목록 닫기',
        es: 'BIBLIOTECA|PAQUETES DE MÚSICA|AJUSTES|SALIR|VOLVER|IDIOMA|APARIENCIA|CLARO|OSCURO|SILENCIAR ADELANTOS|REDUCIR ANIMACIONES|LISTO|SESIÓN FINALIZADA|VOLVER AL INICIO|BUSCAR…|Editar varias canciones|Añadir canción|Cerrar ajustes|CANCIONES|Cerrar la lista',
        iu: 'ᐃᓐᖏᐅᑎᑦ|ᐃᓐᖏᐅᑎᑦ|ᐋᖅᑭᒃᓱᕈᑎᑦ|ᐊᓂᓗᑎᑦ|ᐅᑎᕐᓗᑎᑦ|ᐅᖃᐅᓯᖅ|ᑕᐅᑦᑐᖓ|ᖃᐅᒪᔪᖅ|ᑖᖅᑐᖅ|ᓂᐱᖃᖏᓪᓗᒍ|ᐊᐅᓚᓂᖓᓂᒃ ᒥᑭᓪᓕᑎᑦᑎᓗᑎᑦ|ᐱᔭᕇᖅᑐᖅ|ᐱᔭᕇᖅᑐᖅ|ᐅᑎᕐᓗᑎᑦ|ᕿᓂᕐᓗᒋᑦ…|ᐃᓐᖏᐅᑎᓂᒃ ᐋᖅᑭᒃᓱᐃᓗᑎᑦ|ᐃᓐᖏᐅᒻᒥᒃ ᐃᓚᓯᓗᑎᑦ|ᒪᑐᓗᒍ|ᐃᓐᖏᐅᑎᑦ|ᒪᑐᓗᒍ'
    };
    globalThis.QUALITHM_LOCALES = Object.fromEntries(Object.entries(rows).map(([locale,row]) => {
        const values = row.split('|');
        if (values.length !== keys.length) throw new Error(`Incomplete interface language: ${locale}`);
        return [locale,Object.fromEntries(keys.map((key,index)=>[key,values[index]]))];
    }));
})();
