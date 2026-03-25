const fs = require('fs');
const week5 = JSON.parse(fs.readFileSync('c:/Users/SSAFY/Desktop/S14P21E206/FrontEnd/ssafy-maker/public/assets/game/data/story/fixedevent/fixed_week5.json', 'utf8'));

let issues = [];

if (Array.isArray(week5)) {
    issues.push("1. 파일 포맷: 배열(Array) 형태의 구버전 스키마입니다. (4, 6주차는 객체 기반의 'authoredDialoguesSchema' 포맷으로 통일됨)");
}

const statsRegex = /(gold|madness|favor_[a-zA-Z_]+)/;
const validStats = ['be','code','favor_hyoryeon','favor_minsu','fe','hp','luck','money','nunchi','social','stress','teamwork'];

JSON.stringify(week5, (key, value) => {
    if (key === 'statChanges' && typeof value === 'object') {
        Object.keys(value).forEach(stat => {
            if (!validStats.includes(stat)) {
                issues.push(`2. 잘못된 스탯 속성 (statChanges): ${stat} 발견 (값: ${value[stat]})`);
            }
        });
    }
    if (key === 'condition' && typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(stat => {
            if (!validStats.includes(stat)) {
                issues.push(`3. 잘못된 스탯 조건 (condition/requirements): ${stat} 발견`);
            }
        });
    }
    if (key === 'actionType' && value === 'MADNESS') {
        // actionType: MADNESS is still valid? Let's check schema.
    }
    return value;
});

console.log(issues.join('\n'));
