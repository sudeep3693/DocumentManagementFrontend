import { processNepaliFieldInput, transliterateToNepali } from './src/utils/transliteration.js';

console.log("Testing transliterateToNepali:");
try {
    console.log(transliterateToNepali("homnath"));
} catch (e) {
    console.error("Error in transliterateToNepali:", e);
}

console.log("\nTesting processNepaliFieldInput:");
try {
    console.log(processNepaliFieldInput("homnath"));
} catch (e) {
    console.error("Error in processNepaliFieldInput:", e);
}

console.log("\nTesting applyDevanagariEnglishRules logic manually:");
try {
    let result = "हo";
    const matraTransitions = {
        'ाi': 'ै', 'ाu': 'ौ', 'ाa': 'ा', 'ाe': 'ै', 'ाo': 'ौ',
        'िi': 'ी', 'ुu': 'ू', 'ेe': 'ी', 'ोo': 'ू', 'ोu': 'ौ'
    };
    for (const [key, val] of Object.entries(matraTransitions)) {
        result = result.split(key).join(val);
    }
    console.log(result);
} catch(e) {
    console.error(e);
}
