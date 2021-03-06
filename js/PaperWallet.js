import iconv from 'iconv-lite';
import RustModule from './RustModule';
import { newArray, newArray0, copyArray } from './utils/arrays';
import { apply } from './utils/functions';
import Bip39 from './Bip39';

export const scramble = (module, iv, password, input) => {
  if (iv.length !== 8) {
    throw new Error('IV must be 8 bytes');
  }
  const bufiv = newArray(module, iv);
  const bufinput = newArray(module, input);
  const bufpassword = newArray(module, password);
  const bufoutput = newArray0(module, input.length + 8);
  module.paper_scramble(bufiv, bufpassword, password.length, bufinput, input.length, bufoutput);
  let result = copyArray(module, bufoutput, input.length + 8);
  module.dealloc(bufiv);
  module.dealloc(bufinput);
  module.dealloc(bufpassword);
  module.dealloc(bufoutput);
  return result;
};

/**
 * A sugar method on top of `scramble` that expects string params.
 * @param module - the WASM module that is used for crypto operations
 * @param iv: Uint8Array - 4 random bytes of entropy
 * @param password: string
 * @param mnenomics: string (12 word mnemonics which should be scrambled))
 * @returns {*} - the scrambled 15 words
 */
export const scrambleStrings = (module, iv, password, mnenomics) => (
  Bip39.entropyToMnenomic(
    scramble(module, iv, iconv.encode(password, 'utf8'), Bip39.mnemonicToEntropy(mnenomics))
  )
);

export const unscramble = (module, password, input) => {
  if (input.length < 8) {
    throw new Error('input must be at least 8 bytes');
  }
  const bufinput = newArray(module, input);
  const bufpassword = newArray(module, password);
  const bufoutput = newArray0(module, input.length - 8);
  module.paper_unscramble(bufpassword, password.length, bufinput, input.length, bufoutput);
  let result = copyArray(module, bufoutput, input.length - 8);
  module.dealloc(bufinput);
  module.dealloc(bufpassword);
  module.dealloc(bufoutput);
  return result;
};

/**
 * A sugar method on top of `unscramble` that expects string params.
 * @param module - the WASM module that is used for crypto operations
 * @param password: string
 * @param mnenomics: string (15 words that have been generated by `scrambleStrings`)
 * @returns {*} - the original 12 words mnemonics used for `scrambleStrings`
 */
export const unscrambleStrings = (module, password, mnenomics) => (
  Bip39.entropyToMnenomic(
    unscramble(module, iconv.encode(password, 'utf8'), Bip39.mnemonicToEntropy(mnenomics))
  )
);

export default {
  scramble: apply(scramble, RustModule),
  scrambleStrings: apply(scrambleStrings, RustModule),
  unscramble: apply(unscramble, RustModule),
  unscrambleStrings: apply(unscrambleStrings, RustModule),
}
