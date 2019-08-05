import {generateBox} from '../utils'
// prettier-ignore
export default () => {
  const content = new Uint8Array([
    0x69, 0x73, 0x6F, 0x6D, // major_brand: isom
    0x00, 0x00, 0x00, 0x01, // minor_version: 0x01
    0x69, 0x73, 0x6F, 0x6D, // isom
    0x61, 0x76, 0x63, 0x31, // avc1
  ])
  return generateBox('ftyp', content)
}
