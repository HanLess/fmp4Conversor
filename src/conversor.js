(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.conversor = factory());
}(this, function () { 'use strict';

  class Stream {
    constructor(buffer) {
      this.buffer = buffer;
      this.position = 0;
    }

    readType(length = 4) {
      const typeBuffer = [];

      for (let i = 0; i < length; i++) {
        typeBuffer.push(this.buffer[this.position++]);
      }

      return String.fromCharCode.apply(null, typeBuffer);
    }

    readByte(length) {
      switch (length) {
        case 1:
          return this.readOneByte();

        case 2:
          return this.readTwoByte();

        case 3:
          return this.readThreeByte();

        case 4:
          return this.readFourByte();

        default:
          return 0;
      }
    }

    readOneByte() {
      return this.buffer[this.position++] >>> 0;
    }

    readTwoByte() {
      return (this.buffer[this.position++] << 8 | this.buffer[this.position++]) >>> 0;
    }

    readThreeByte() {
      return (this.buffer[this.position++] << 16 | this.buffer[this.position++] << 8 | this.buffer[this.position++]) >>> 0;
    }

    readFourByte() {
      return (this.buffer[this.position++] << 24 | this.buffer[this.position++] << 16 | this.buffer[this.position++] << 8 | this.buffer[this.position++]) >>> 0;
    }

  }

  function ftyp(buffer) {
    const stream = new Stream(buffer);
    const majorBrand = stream.readType();
    const minorVersion = stream.readByte(4);
    const compatibleBrands = [];

    for (let i = stream.position; i < buffer.length; i += 4) {
      compatibleBrands.push(stream.readType(4));
    }

    const ftypBox = {
      majorBrand,
      minorVersion,
      compatibleBrands
    };
    return ftypBox;
  }

  function mvhd(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const creationTime = stream.readByte(4);
    const modificationTime = stream.readByte(4);
    const timescale = stream.readByte(4);
    const duration = stream.readByte(4);
    const rate = stream.readByte(4);
    const volume = stream.readByte(1); // reserved

    stream.readByte(3);
    stream.readByte(4);
    stream.readByte(4);
    const matrix = [];

    for (let i = 0; i < 36; i += 4) {
      matrix.push(stream.readByte(4));
    } // preDefined


    for (let i = 0; i < 24; i += 4) {
      stream.readByte(4);
    }

    const nextTrackID = stream.readByte(4);
    const mvhdBox = {
      version,
      flags,
      creationTime,
      modificationTime,
      timescale,
      duration,
      rate,
      volume,
      matrix,
      nextTrackID
    };
    return mvhdBox;
  }

  function tkhd(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const creationTime = stream.readByte(4);
    const modificationTime = stream.readByte(4);
    const trackID = stream.readByte(4); // reserved

    stream.readByte(4);
    const duration = stream.readByte(4); // reserved

    stream.readByte(4);
    stream.readByte(4);
    const layer = stream.readByte(2);
    const alternateGroup = stream.readByte(2);
    const volume = stream.readByte(2); // reserved

    stream.readByte(2);
    const matrix = [];

    for (let i = 0; i < 36; i += 4) {
      matrix.push(stream.readByte(4));
    }

    const width = Number(`${stream.readByte(2)}.${stream.readByte(2)}`);
    const height = Number(`${stream.readByte(2)}.${stream.readByte(2)}`);
    const tkhdBox = {
      version,
      flags,
      creationTime,
      modificationTime,
      trackID,
      duration,
      layer,
      alternateGroup,
      volume,
      matrix,
      width,
      height
    };
    return tkhdBox;
  }

  function elst(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const entryCount = stream.readByte(4);
    const entries = [];

    for (let i = 0; i < entryCount; ++i) {
      const segmentDuration = stream.readByte(4);
      let mediaTime = stream.readByte(4); // 0xffffffff -> -1

      if (mediaTime === 4294967295) {
        mediaTime = -1;
      }

      const mediaRateInteger = stream.readByte(2);
      const mediaRateFraction = stream.readByte(2);
      entries.push({
        segmentDuration,
        mediaTime,
        mediaRateInteger,
        mediaRateFraction
      });
    }

    const elstBox = {
      version,
      flags,
      entries
    };
    return elstBox;
  }

  function mdhd(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const creationTime = stream.readByte(4);
    const modificationTime = stream.readByte(4);
    const timescale = stream.readByte(4);
    const duration = stream.readByte(4);
    const language = stream.readByte(2);
    const field = [];
    field[0] = language >> 10 & 0x1f;
    field[1] = language >> 5 & 0x1f;
    field[2] = language & 0x1f;
    const languageString = String.fromCharCode(0x60 + field[0], 0x60 + field[1], 0x60 + field[2]); // preDefined

    stream.readByte(2);
    const mdhdBox = {
      version,
      flags,
      creationTime,
      modificationTime,
      timescale,
      duration,
      languageString
    };
    return mdhdBox;
  }

  function hdlr(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3); // preDefined

    stream.readByte(4);
    const handlerType = stream.readType().toString();
    const handlerType2 = stream.readType().toString(); // reserved

    stream.readByte(4);
    stream.readByte(4);
    const name = [];
    let c;

    while ((c = stream.readByte(1)) !== 0x00) {
      name.push(String.fromCharCode(c));
    }

    const hdlrBox = {
      version,
      flags,
      handlerType,
      handlerType2: handlerType2 || 0,
      name: name.join('')
    };
    return hdlrBox;
  }

  function vmhd(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const graphicsmode = stream.readByte(2);
    const opcolor = new Array(3).fill(stream.readByte(2));
    const vmhdBox = {
      version,
      flags,
      graphicsmode,
      opcolor
    };
    return vmhdBox;
  }

  function dref(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const entryCount = stream.readByte(4);
    const urlBox = [];
    const urlBuffer = stream.buffer.slice(8);
    const newStream = new Stream(urlBuffer);
    const MP4Box$1 = new MP4Box();

    for (let i = 0; i < entryCount; i++) {
      MP4Box$1.readSize(newStream);
      MP4Box$1.readType(newStream);
      MP4Box$1.readBody(newStream);
      urlBox.push(MP4Box$1.box);
    }

    const drefBox = {
      version,
      flags,
      url: urlBox
    };
    return drefBox;
  }

  function url(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const urlBox = {
      version,
      flags
    };
    return urlBox;
  }

  function stsd(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const entryCount = stream.readByte(4);
    const box = [];
    const avc1Buffer = stream.buffer.slice(8);
    const newStream = new Stream(avc1Buffer);
    const MP4Box$1 = new MP4Box();
    let type = 'avc1';

    for (let i = 0; i < entryCount; i++) {
      MP4Box$1.readSize(newStream);
      MP4Box$1.readType(newStream);
      MP4Box$1.readBody(newStream);
      box.push(MP4Box$1.box);
      type = MP4Box$1.type;
    }

    const stsdBox = {
      version,
      flags,
      [type]: box
    };
    return stsdBox;
  }

  function avc1(buffer) {
    const stream = new Stream(buffer); // reserved

    stream.readByte(4);
    stream.readByte(2);
    const dataReferenceIndex = stream.readByte(2); // preDefined

    stream.readByte(2); // reserved

    stream.readByte(2); // preDefined

    stream.readByte(4);
    stream.readByte(4);
    stream.readByte(4);
    const width = stream.readByte(2);
    const height = stream.readByte(2);
    const horizresolution = stream.readByte(4);
    const vertresolution = stream.readByte(4); // reserved

    stream.readByte(4);
    const frameCount = stream.readByte(2);
    const compressorname = stream.readType(32);
    const depth = stream.readByte(2); // preDefined

    stream.readByte(2);
    const avcCBuffer = stream.buffer.slice(78);
    const newStream = new Stream(avcCBuffer);
    const MP4Box$1 = new MP4Box();
    MP4Box$1.readSize(newStream);
    MP4Box$1.readType(newStream);
    MP4Box$1.readBody(newStream);
    const avcCBox = MP4Box$1.box;
    const avc1Box = {
      dataReferenceIndex,
      width,
      height,
      horizresolution,
      vertresolution,
      frameCount,
      compressorname,
      depth,
      avcC: avcCBox
    };
    return avc1Box;
  }

  function avcC(buffer) {
    const stream = new Stream(buffer);
    const configurationVersion = stream.readByte(1);
    const AVCProfileIndication = stream.readByte(1);
    const profileCompatibility = stream.readByte(1);
    const AVCLevelIndication = stream.readByte(1);
    const lengthSizeMinusOne = stream.readByte(1) & 0x3;
    const numOfSequenceParameterSets = stream.readByte(1) & 31;
    const SPS = [];

    for (let i = 0; i < numOfSequenceParameterSets; i++) {
      const length = stream.readByte(2);
      SPS.push(...stream.buffer.slice(stream.position, stream.position + length));
      stream.position += length;
    }

    const numOfPictureParameterSets = stream.readByte(1);
    const PPS = [];

    for (let i = 0; i < numOfPictureParameterSets; i++) {
      const length = stream.readByte(2);
      PPS.push(...stream.buffer.slice(stream.position, stream.position + length));
      stream.position += length;
    }

    const avcCBox = {
      configurationVersion,
      AVCProfileIndication,
      profileCompatibility,
      AVCLevelIndication,
      lengthSizeMinusOne,
      SPS,
      PPS
    };
    return avcCBox;
  }

  function stts(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const entryCount = stream.readByte(4);
    const samples = [];

    for (let i = 0; i < entryCount; i++) {
      const sampleCount = stream.readByte(4);
      const sampleDelta = stream.readByte(4);
      samples.push({
        sampleCount,
        sampleDelta
      });
    }

    const sttsBox = {
      version,
      flags,
      samples
    };
    return sttsBox;
  }

  function stss(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const entryCount = stream.readByte(4);
    const samples = [];

    for (let i = 0; i < entryCount; i++) {
      samples.push({
        sampleNumber: stream.readByte(4)
      });
    }

    const stssBox = {
      version,
      flags,
      samples
    };
    return stssBox;
  }

  function ctts(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const entryCount = stream.readByte(4);
    const samples = [];

    for (let i = 0; i < entryCount; i++) {
      samples.push({
        sampleCount: stream.readByte(4),
        sampleOffset: stream.readByte(4)
      });
    }

    const cttsBox = {
      version,
      flags,
      samples
    };
    return cttsBox;
  }

  function mdhd$1(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const entryCount = stream.readByte(4);
    const samples = [];

    for (let i = 0; i < entryCount; i++) {
      samples.push({
        firstChunk: stream.readByte(4),
        samplesPerChunk: stream.readByte(4),
        sampleDescriptionIndex: stream.readByte(4)
      });
    }

    const mdhdBox = {
      version,
      flags,
      samples
    };
    return mdhdBox;
  }

  function stss$1(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const sampleSize = stream.readByte(4);
    const sampleCount = stream.readByte(4);
    const samples = [];

    for (let i = 0; i < sampleCount; i++) {
      samples.push({
        entrySize: stream.readByte(4)
      });
    }

    const stssBox = {
      version,
      flags,
      sampleSize,
      samples
    };
    return stssBox;
  }

  function stco(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const entryCount = stream.readByte(4);
    const samples = [];

    for (let i = 0; i < entryCount; i++) {
      samples.push({
        chunkOffset: stream.readByte(4)
      });
    }

    const stcoBox = {
      version,
      flags,
      samples
    };
    return stcoBox;
  }

  function smhd(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const data = [];

    for (let i = 0; i < 4; i++) {
      data.push(stream.readByte(1));
    }

    const smhdBox = {
      version,
      flags,
      data
    };
    return smhdBox;
  }

  function mp4a(buffer) {
    const stream = new Stream(buffer); // reserved

    stream.readByte(4);
    stream.readByte(2);
    const dataReferenceIndex = stream.readByte(2); // preDefined

    stream.readByte(2); // reserved

    stream.readByte(2); // preDefined

    stream.readByte(4);
    const channelCount = stream.readByte(2);
    const sampleSize = stream.readByte(2); // reserved

    stream.readByte(4);
    const sampleRate = stream.readByte(4) / (1 << 16);
    const esdsBuffer = stream.buffer.slice(28);
    const newStream = new Stream(esdsBuffer);
    const MP4Box$1 = new MP4Box();
    MP4Box$1.readSize(newStream);
    MP4Box$1.readType(newStream);
    MP4Box$1.readBody(newStream);
    const esdsBox = MP4Box$1.box;
    const mp4aBox = {
      dataReferenceIndex,
      channelCount,
      sampleSize,
      sampleRate,
      esds: esdsBox
    };
    return mp4aBox;
  }

  const TAGS = [null, null, null, 'ESDescrTag', 'DecoderConfigDescrTag', 'DecSpecificDescrTag'];
  function esds(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const type = TAGS[stream.readByte(1)];
    const esdsBox = {
      version,
      flags,
      [type]: getESDescrTag(stream)
    };
    return esdsBox;
  }

  function getESDescrTag(stream) {
    const data = {};
    let size = stream.readByte(1);

    if (size === 0x80) {
      stream.readByte(2);
      size = stream.readByte(1) + 5;
    } else {
      size += 2;
    }

    data.size = size;
    data.ESID = stream.readByte(2);
    data.streamPriority = stream.readByte(1);
    data[TAGS[stream.readByte(1)]] = getDecoderConfigDescrTag(stream);
    data[TAGS[stream.readByte(1)]] = getDecSpecificDescrTag(stream);
    return data;
  }

  function getDecoderConfigDescrTag(stream) {
    const data = {};
    let size = stream.readByte(1);

    if (size === 0x80) {
      stream.readByte(2);
      size = stream.readByte(1) + 5;
    } else {
      size += 2;
    }

    data.size = size;
    data.objectTypeIndication = stream.readByte(1);
    const type = stream.readByte(1);
    data.streamType = type & (1 << 7) - 1;
    data.upStream = type & 1 << 1;
    data.bufferSize = stream.readByte(3);
    data.maxBitrate = stream.readByte(4);
    data.avgBitrate = stream.readByte(4);
    return data;
  }

  function getDecSpecificDescrTag(stream) {
    const data = {};
    let size = stream.readByte(1);
    let dataSize = size;

    if (size === 0x80) {
      stream.readByte(2);
      size = stream.readByte(1) + 5;
      dataSize = size - 5;
    } else {
      size += 2;
    }

    data.size = size;
    const EScode = [];

    for (let i = 0; i < dataSize; i++) {
      EScode.push(Number(stream.readByte(1)).toString(16).padStart(2, '0'));
    }

    data.audioConfig = EScode.map(item => Number(`0x${item}`));
    return data;
  }

  function meta(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const metaBox = {
      version,
      flags
    };
    return metaBox;
  }

  function mdat(buffer) {
    const stream = new Stream(buffer);
    const data = stream.buffer.subarray(stream.position, stream.buffer.length);
    const mdatBox = {
      data
    };
    return mdatBox;
  }

  function sdtp(buffer) {
    const stream = new Stream(buffer);
    const version = stream.readByte(1);
    const flags = stream.readByte(3);
    const samplesFlag = [];

    for (let i = stream.position; i < buffer.length; i++) {
      const tmpByte = stream.readByte(1);
      samplesFlag.push({
        isLeading: tmpByte >> 6,
        dependsOn: tmpByte >> 4 & 0x3,
        isDepended: tmpByte >> 2 & 0x3,
        hasRedundancy: tmpByte & 0x3
      });
    }

    const sdtpBox = {
      version,
      flags,
      samplesFlag
    };
    return sdtpBox;
  }

  function thmb(buffer) {
    const stream = new Stream(buffer);
    const data = stream.readByte(buffer.length);
    const thmbBox = {
      data
    };
    return thmbBox;
  }

  var boxParse = {
    ftyp,
    mvhd,
    tkhd,
    elst,
    mdhd,
    hdlr,
    vmhd,
    dref,
    'url ': url,
    stsd,
    avc1,
    avcC,
    stts,
    stss,
    ctts,
    stsc: mdhd$1,
    stsz: stss$1,
    stco,
    smhd,
    mp4a,
    esds,
    meta,
    mdat,
    sdtp,
    thmb
  };

  const CONTAINER_BOXES = ['moov', 'trak', 'edts', 'mdia', 'minf', 'dinf', 'stbl'];
  const SPECIAL_BOXES = ['udta', 'free'];
  class MP4Box {
    constructor() {
      this.size = 0;
      this.type = '';
      this.start = 0;
      this.box = {};
    }

    readSize(stream) {
      this.start = stream.position;
      this.size = stream.readByte(4);
    }

    readType(stream) {
      this.type = stream.readType(); // 一个 box 的 size 只可能大于等于 8
      // 如果从 readSize 中解析出来的 mdat size 为 1，则表明此视频比较大，需要 type 后的 8 个字节来计算实际大小

      if (this.size === 1) {
        this.size = stream.readByte(4) << 32;
        this.size |= stream.readByte(4);
      }
    }

    readBody(stream) {
      this.data = stream.buffer.slice(stream.position, this.size + this.start);

      if (CONTAINER_BOXES.find(item => item === this.type) || SPECIAL_BOXES.find(item => item === this.type)) {
        this.parserContainerBox();
      } else {
        if (!boxParse[this.type]) {
          this.box = {};
        } else {
          this.box = { ...this.box,
            ...boxParse[this.type](this.data)
          };
        }
      }

      stream.position += this.data.length;
    }

    parserContainerBox() {
      const stream = new Stream(this.data);
      const size = stream.buffer.length;

      while (stream.position < size) {
        const Box = new MP4Box();
        Box.readSize(stream);
        Box.readType(stream);
        Box.readBody(stream);

        if (Box.type === 'trak' && Box.box.mdia && Box.box.mdia.hdlr) {
          const handlerType = Box.box.mdia.hdlr.handlerType;

          if (handlerType === 'vide') {
            this.box.videoTrak = Box.box;
          } else if (handlerType === 'soun') {
            this.box.audioTrak = Box.box;
          } else {
            this.box[`${handlerType}Trak`] = Box.box;
          }
        } else {
          this.box[Box.type] = Box.box;
        }
      }
    }

  }

  class MP4Parse {
    constructor(buffer) {
      this.buffer = buffer;
      this.stream = new Stream(buffer);
      this.mp4BoxTreeObject = {};
      this.init();
    }

    init() {
      this.parse();
    }

    parse() {
      while (this.stream.position < this.buffer.length) {
        const MP4Box$1 = new MP4Box();
        MP4Box$1.readSize(this.stream);
        MP4Box$1.readType(this.stream);
        MP4Box$1.readBody(this.stream);
        this.mp4BoxTreeObject[MP4Box$1.type] = MP4Box$1.box;
        this.mp4BoxTreeObject[MP4Box$1.type].size = MP4Box$1.size;
      }
    }

  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function findBox(mp4BoxTree, type) {
    switch (type) {
      case 'moov':
        return findMoovBox(mp4BoxTree);

      case 'mvhd':
        return findMvhdBox(mp4BoxTree);

      case 'videoTrak':
        return findVideoTrakBox(mp4BoxTree);

      case 'audioTrak':
        return findAudioTrakBox(mp4BoxTree);

      case 'videoTkhd':
        return findVideoTkhdBox(mp4BoxTree);

      case 'audioTkhd':
        return findAudioTkhdBox(mp4BoxTree);

      case 'videoStbl':
        return findVideoStblBox(mp4BoxTree);

      case 'audioStbl':
        return findAudioStblBox(mp4BoxTree);

      case 'videoStsc':
        return findVideoStscBox(mp4BoxTree);

      case 'audioStsc':
        return findAudioStscBox(mp4BoxTree);

      case 'avcC':
        return findAvcCBox(mp4BoxTree);

      case 'esds':
        return findEsdsBox(mp4BoxTree);

      case 'videoStco':
        return findVideoStcoBox(mp4BoxTree);

      case 'audioStco':
        return findAudioStcoBox(mp4BoxTree);

      case 'videoStts':
        return findVideoSttsBox(mp4BoxTree);

      case 'audioStts':
        return findAudioSttsBox(mp4BoxTree);

      case 'audioMdhd':
        return findAudioMdhdBox(mp4BoxTree);

      case 'videoMdhd':
        return findVideoMdhdBox(mp4BoxTree);

      case 'videoStss':
        return findVideoStssBox(mp4BoxTree);

      case 'videoStsz':
        return findVideoStszBox(mp4BoxTree);

      case 'videoCtts':
        return findVideoCttsBox(mp4BoxTree);

      case 'audioStsz':
        return findAudioStszBox(mp4BoxTree);

      case 'mp4a':
        return findMp4aBox(mp4BoxTree);

      case 'audioElst':
        return findAudioElstBox(mp4BoxTree);

      case 'videoElst':
        return findVideoElstBox(mp4BoxTree);

      default:
        return {};
    }
  }

  function findMoovBox(mp4BoxTree) {
    return mp4BoxTree['moov'];
  }

  function findMvhdBox(mp4BoxTree) {
    return findMoovBox(mp4BoxTree)['mvhd'];
  }

  function findVideoTrakBox(mp4BoxTree) {
    return findMoovBox(mp4BoxTree)['videoTrak'];
  }

  function findVideoTkhdBox(mp4BoxTree) {
    return findVideoTrakBox(mp4BoxTree)['tkhd'];
  }

  function findVideoStblBox(mp4BoxTree) {
    return findVideoTrakBox(mp4BoxTree)['mdia']['minf']['stbl'];
  }

  function findAudioTrakBox(mp4BoxTree) {
    return findMoovBox(mp4BoxTree)['audioTrak'];
  }

  function findAudioStblBox(mp4BoxTree) {
    return findAudioTrakBox(mp4BoxTree)['mdia']['minf']['stbl'];
  }

  function findAudioTkhdBox(mp4BoxTree) {
    return findAudioTrakBox(mp4BoxTree)['tkhd'];
  }

  function findVideoStscBox(mp4BoxTree) {
    return findVideoStblBox(mp4BoxTree)['stsc'];
  }

  function findAudioStscBox(mp4BoxTree) {
    return findAudioStblBox(mp4BoxTree)['stsc'];
  }

  function findAvcCBox(mp4BoxTree) {
    return findVideoStblBox(mp4BoxTree)['stsd']['avc1'][0]['avcC'];
  }

  function findMp4aBox(mp4BoxTree) {
    return findAudioStblBox(mp4BoxTree)['stsd']['mp4a'][0];
  }

  function findEsdsBox(mp4BoxTree) {
    return findMp4aBox(mp4BoxTree)['esds'];
  }

  function findVideoStcoBox(mp4BoxTree) {
    return findVideoStblBox(mp4BoxTree)['stco'];
  }

  function findAudioStcoBox(mp4BoxTree) {
    return findAudioStblBox(mp4BoxTree)['stco'];
  }

  function findVideoSttsBox(mp4BoxTree) {
    return findVideoStblBox(mp4BoxTree)['stts'];
  }

  function findAudioSttsBox(mp4BoxTree) {
    return findAudioStblBox(mp4BoxTree)['stts'];
  }

  function findVideoMdhdBox(mp4BoxTree) {
    return findVideoTrakBox(mp4BoxTree)['mdia']['mdhd'];
  }

  function findAudioMdhdBox(mp4BoxTree) {
    return findAudioTrakBox(mp4BoxTree)['mdia']['mdhd'];
  }

  function findVideoStssBox(mp4BoxTree) {
    return findVideoStblBox(mp4BoxTree)['stss'];
  }

  function findVideoStszBox(mp4BoxTree) {
    return findVideoStblBox(mp4BoxTree)['stsz'];
  }

  function findAudioStszBox(mp4BoxTree) {
    return findAudioStblBox(mp4BoxTree)['stsz'];
  }

  function findVideoCttsBox(mp4BoxTree) {
    return findVideoStblBox(mp4BoxTree)['ctts'];
  }

  function findAudioElstBox(mp4BoxTree) {
    return findAudioTrakBox(mp4BoxTree)['edts']['elst'];
  }

  function findVideoElstBox(mp4BoxTree) {
    return findAudioTrakBox(mp4BoxTree)['edts']['elst'];
  }

  function getSamplesOffset(stszBox, stscBoxSamplesPerChunkArray) {
    const samplesOffset = [];

    for (let i = 0, j = 0; i < stscBoxSamplesPerChunkArray.length; i++) {
      if (i + j >= stszBox.samples.length) {
        break;
      }

      samplesOffset.push(stszBox.samples[i + j].entrySize);

      if (stscBoxSamplesPerChunkArray[i] !== 1) {
        for (let flag = 1; flag < stscBoxSamplesPerChunkArray[i]; flag++) {
          const offset = stszBox.samples[i + flag + j].entrySize + samplesOffset[i + flag - 1 + j];
          samplesOffset.push(offset);
        }

        j = j + stscBoxSamplesPerChunkArray[i] - 1;
      }
    }

    return samplesOffset;
  }

  function getPerChunkArray(stscBox, end) {
    const stscBoxSamplesPerChunkArray = [];
    const stscSamplesLength = stscBox.samples.length; // stsc box
    // firstChunk         1  3  6  7
    // samplesPerChunk    1  2  1  2
    // ↓
    // [1,1,2,2,2,1,2,2]

    for (let i = 0; i < end; i++) {
      if (i !== 0 && i < stscSamplesLength && stscBox.samples[i].firstChunk - 1 !== stscBox.samples[i - 1].firstChunk) {
        i--;
        stscBox.samples[i].firstChunk++;
      } // 处理最后一位不是 end 时的情况


      if (i >= stscSamplesLength) {
        if (stscBox.samples[stscSamplesLength - 1] !== 1) {
          i = i + stscBox.samples[stscSamplesLength - 1].samplesPerChunk - 1;
        }

        stscBoxSamplesPerChunkArray.push(stscBox.samples[stscSamplesLength - 1].samplesPerChunk);
      } else {
        stscBoxSamplesPerChunkArray.push(stscBox.samples[i].samplesPerChunk);
      }
    }

    return stscBoxSamplesPerChunkArray;
  }

  function getFragmentPosition(videoSamples, audioSamples, mdatStart, isLastFragmentPosition) {
    const videoSamplesEnd = videoSamples[videoSamples.length - 1].end;
    let videoSamplesStart = 0;

    if (videoSamples.length > 0) {
      videoSamplesStart = videoSamples[0].start;
    } // maybe the last GOP dont have audio track
    // 最后一个 GOP 序列可能没有音频轨


    let audioSamplesEnd = 0;
    let audioSamplesStart = Number.MAX_SAFE_INTEGER;

    if (audioSamples.length !== 0) {
      audioSamplesEnd = audioSamples[audioSamples.length - 1].end;
      audioSamplesStart = audioSamples[0].start;
    }

    const fragmentEndPosition = isLastFragmentPosition ? '' : Math.max(videoSamplesEnd, audioSamplesEnd) + mdatStart;
    const fragmentStartPosition = Math.min(videoSamplesStart, audioSamplesStart) + mdatStart;
    return [fragmentStartPosition, fragmentEndPosition];
  }

  var cloneDeep = function (obj) {
    var str = JSON.stringify(obj);
    return JSON.parse(str);
  };

  function getBufferStart(mp4BoxTree, videoOffsetStart = 0, audioOffsetStart = 0) {
    return Math.min(getChunkSize(mp4BoxTree, videoOffsetStart, 'video'), getChunkSize(mp4BoxTree, audioOffsetStart, 'audio'));
  }

  function getChunkSize(mp4BoxTree, offsetStart, type) {
    const stscBox = cloneDeep(findBox(mp4BoxTree, type === 'video' ? 'videoStsc' : 'audioStsc'));
    let newOffsetStart = 0;
    const stscBoxSamplesPerChunkArray = getPerChunkArray(stscBox, offsetStart);
    let chunkIndex = 0;

    for (let i = 0; offsetStart > 0 && i <= stscBoxSamplesPerChunkArray.length; i++) {
      newOffsetStart += stscBoxSamplesPerChunkArray[i];

      if (newOffsetStart === offsetStart) {
        chunkIndex = i + 1;
        break;
      } else if (newOffsetStart > offsetStart) {
        newOffsetStart -= stscBoxSamplesPerChunkArray[i];
        chunkIndex = i;
        break;
      }
    }

    const sampleInterval = [newOffsetStart, offsetStart];
    const stszBox = findBox(mp4BoxTree, type === 'video' ? 'videoStsz' : 'audioStsz');
    let sampleSize = 0; // 考虑到 stsc 不为 1 的情况

    const samples = stszBox.samples.slice(sampleInterval[0], sampleInterval[1]);

    for (let i = 0; i < samples.length; i++) {
      sampleSize += samples[i].entrySize;
    }

    const stcoBox = findBox(mp4BoxTree, type === 'video' ? 'videoStco' : 'audioStco'); // 如果最后一个 GOP 没有音频轨，BufferStart 需要按照视频轨来计算。
    // If the last GOP dont have audio track, we should ignore the audio chunk size.

    if (chunkIndex >= stcoBox.samples.length) {
      return Number.MAX_SAFE_INTEGER;
    }

    return stcoBox.samples[chunkIndex].chunkOffset + sampleSize;
  }

  function getVideoSamples(mp4BoxTree, bufferStart, offsetInterVal) {
    const cttsBox = cloneDeep(findBox(mp4BoxTree, 'videoCtts'));
    const compositionTimeOffset = [];

    if (cttsBox) {
      for (let i = 0; i < cttsBox.samples.length; i++) {
        compositionTimeOffset.push(cttsBox.samples[i].sampleOffset);

        if (cttsBox.samples[i].sampleCount !== 1) {
          cttsBox.samples[i].sampleCount--;
          i--;
        }
      }
    }

    return getSamples(mp4BoxTree, bufferStart, offsetInterVal, compositionTimeOffset);
  }
  function getAudioSamples(mp4BoxTree, bufferStart, offsetInterVal) {
    return getSamples(mp4BoxTree, bufferStart, offsetInterVal);
  }

  function getSamples(mp4BoxTree, bufferStart, [offsetStart, offsetEnd], compositionTimeOffset) {
    const samples = [];
    const sttsBox = findBox(mp4BoxTree, compositionTimeOffset ? 'videoStts' : 'audioStts');
    const stszBox = findBox(mp4BoxTree, compositionTimeOffset ? 'videoStsz' : 'audioStsz');
    const stcoBox = findBox(mp4BoxTree, compositionTimeOffset ? 'videoStco' : 'audioStco');
    const stscBox = cloneDeep(findBox(mp4BoxTree, compositionTimeOffset ? 'videoStsc' : 'audioStsc'));
    const stscBoxSamplesPerChunkArray = getPerChunkArray(stscBox, offsetEnd);
    const samplesOffset = getSamplesOffset(stszBox, stscBoxSamplesPerChunkArray);
    const sttsFormatBox = [];

    for (let i = 0; i < sttsBox.samples.length; i++) {
      const {
        sampleCount,
        sampleDelta
      } = sttsBox.samples[i];
      sttsFormatBox.push({
        sampleCount: sampleCount + (sttsFormatBox[i - 1] ? sttsFormatBox[i - 1].sampleCount : 0),
        sampleDelta
      });
    } // 算法不太好，可以和下面 for 循环结合，用双指针来做
    // FIXME


    const chunkOffsetArray = [];

    for (let i = 0; i < stscBoxSamplesPerChunkArray.length; i++) {
      for (let j = 0; j < stscBoxSamplesPerChunkArray[i]; j++) {
        const sample = stcoBox.samples[i];
        chunkOffsetArray.push(sample ? sample.chunkOffset : stcoBox.samples[stcoBox.samples.length - 1].chunkOffset);
      }
    }

    for (let i = offsetStart; i < offsetEnd; i++) {
      const {
        entrySize: size
      } = stszBox.samples[i];
      const end = chunkOffsetArray[i] - bufferStart + samplesOffset[i];
      const start = end - size;
      const duration = sttsFormatBox.find((sample, idx) => {
        if (sttsFormatBox[idx - 1]) {
          return i + 1 <= sample.sampleCount && i + 1 > sttsFormatBox[idx - 1].sampleCount;
        } else {
          return i + 1 <= sample.sampleCount;
        }
      }).sampleDelta;
      samples.push({ // 只有 video 有此字段，没有 B 帧的视频，compositionTimeOffset 为 0
        ...(compositionTimeOffset && {
          compositionTimeOffset: compositionTimeOffset.length ? compositionTimeOffset[i] : 0
        }),
        duration,
        size,
        start,
        end,
        bufferStart
      });
    }

    return samples;
  }

  function getDuration(sttsBox, totalCount) {
    let count = 0;
    let duration = 0;

    for (let i = 0; i < sttsBox.samples.length; i++) {
      const {
        sampleCount,
        sampleDelta
      } = sttsBox.samples[i];

      for (let j = 0; j < sampleCount; j++) {
        if (count < totalCount && totalCount !== 0) {
          duration += sampleDelta;
          count++;
        } else {
          return duration;
        }
      }
    }

    return duration;
  }

  function getVideoSamplesInterval(mp4BoxTree, time = 0) {
    const stssBox = cloneDeep(findBox(mp4BoxTree, 'videoStss'));
    const sttsBox = cloneDeep(findBox(mp4BoxTree, 'videoStts'));
    const stszBox = findBox(mp4BoxTree, 'videoStsz');
    const duration = getDuration(sttsBox, stszBox.samples.length);
    const intervalArray = getIntervalArray(stssBox, stszBox);
    const timeInterval = intervalArray.map(interval => getDuration(sttsBox, interval));
    const interval = {
      offsetInterVal: [],
      timeInterVal: []
    };

    for (let i = 0; i < timeInterval.length; i++) {
      const start = timeInterval[i];
      const end = timeInterval[i + 1] ? timeInterval[i + 1] : duration;

      if (start <= time && time < end) {
        const offsetStart = intervalArray[i];
        const offsetEnd = intervalArray[i + 1] !== undefined ? intervalArray[i + 1] : stszBox.samples.length;
        interval.offsetInterVal.push(offsetStart, offsetEnd);
        interval.timeInterVal.push(start, end);
        break;
      }
    }

    return interval;
  }
  function getAudioSamplesInterval(mp4BoxTree, videoInterval) {
    const {
      timeInterVal: [startTime, endTime],
      offsetInterVal
    } = videoInterval;
    const sttsBox = cloneDeep(findBox(mp4BoxTree, 'audioStts'));
    const {
      timescale: audioTimescale
    } = findBox(mp4BoxTree, 'audioMdhd');
    const {
      timescale: videoTimescale
    } = findBox(mp4BoxTree, 'videoMdhd');
    const videoStszBox = findBox(mp4BoxTree, 'videoStsz');
    const audioStszBox = findBox(mp4BoxTree, 'audioStsz');
    const audioElstBox = findBox(mp4BoxTree, 'audioElst');
    const audioStartTime = startTime / videoTimescale * audioTimescale;
    const audioEndTime = endTime / videoTimescale * audioTimescale;
    let start = 0;
    let end = 0;
    const {
      mediaTime,
      segmentDuration
    } = audioElstBox.entries[0];
    let startDuration = mediaTime !== -1 ? mediaTime : segmentDuration;
    let endDuration = 0;

    for (let i = 0; i < sttsBox.samples.length; i++) {
      const {
        sampleCount,
        sampleDelta
      } = sttsBox.samples[i];

      for (let j = 0; j < sampleCount; j++) {
        if (startDuration <= audioStartTime && audioStartTime !== 0) {
          startDuration += sampleDelta;
          start++;
        }

        if (endDuration <= audioEndTime) {
          endDuration += sampleDelta;
          end++;
        }
      }
    } // 如果是 video 的最后一个片段，也就是 audio 的最有一个片段
    // 使用 stsz 的长度来判断


    let audioEnd;

    if (offsetInterVal[1] === videoStszBox.samples.length) {
      audioEnd = audioStszBox.samples.length;
    }

    const interval = {
      offsetInterVal: [start, audioEnd ? audioEnd : end],
      timeInterVal: [startDuration, endDuration]
    };
    return interval;
  }
  function getNextVideoSamplesInterval(mp4BoxTree, sample) {
    const stssBox = cloneDeep(findBox(mp4BoxTree, 'videoStss'));
    const sttsBox = cloneDeep(findBox(mp4BoxTree, 'videoStts'));
    const stszBox = findBox(mp4BoxTree, 'videoStsz');
    const sampleCount = stszBox.samples.length;
    const duration = getDuration(sttsBox, sampleCount);
    const intervalArray = getIntervalArray(stssBox, stszBox);
    const timeInterval = intervalArray.map(interval => getDuration(sttsBox, interval));
    let result = [];

    if (sample + 1 > intervalArray[intervalArray.length - 1]) {
      result = {
        offsetInterVal: [intervalArray[intervalArray.length - 1], sampleCount],
        timeInterVal: [timeInterval[intervalArray.length - 1], duration]
      };
    }

    for (let i = 0; i < intervalArray.length; i++) {
      if (intervalArray[i] < sample + 1 && intervalArray[i + 1] >= sample + 1) {
        result = {
          offsetInterVal: [intervalArray[i], intervalArray[i + 1]],
          timeInterVal: [timeInterval[i], timeInterval[i + 1]]
        };
        break;
      }
    }

    return result;
  }
  function getIntervalArray(stssBox, stszBox) {
    let intervalArray = [];

    if (stssBox) {
      intervalArray = stssBox.samples.map(sample => sample.sampleNumber - 1);
    } else {
      // make a fake GOP when video dont have B/P frame
      for (let i = 0; i <= Math.floor(stszBox.samples.length / 5); i++) {
        intervalArray.push(i * 5);
      }
    }

    return intervalArray;
  }

  function getVideoTrackInfo(videoSamples, mdatBuffer) {
    return {
      samples: videoSamples.map(sample => {
        return { ...sample,
          buffer: mdatBuffer.slice(sample.start, sample.end)
        };
      }),
      trackId: 1
    };
  }
  function getAudioTrackInfo(audioSamples, mdatBuffer) {
    return {
      samples: audioSamples.map(sample => {
        return { ...sample,
          buffer: mdatBuffer.slice(sample.start, sample.end)
        };
      }),
      trackId: 2
    };
  }

  class MP4Probe {
    constructor(mp4BoxTree) {
      _defineProperty(this, "updateInterval", time => {
        const {
          videoTimescale,
          audioTimescale
        } = this.mp4Data;

        if (typeof time === 'number') {
          this.videoInterval = getVideoSamplesInterval(this.mp4BoxTree, time * videoTimescale);
        } else {
          this.videoInterval = getNextVideoSamplesInterval(this.mp4BoxTree, this.videoInterval.offsetInterVal[1]);
        }

        this.audioInterval = getAudioSamplesInterval(this.mp4BoxTree, this.videoInterval);
        const videoTimeRange = this.videoInterval.timeInterVal.map(time => time / videoTimescale);
        const audioTimeRange = this.audioInterval.timeInterVal.map(time => time / audioTimescale);
        this.timeRange = [Math.min(videoTimeRange[0], audioTimeRange[0]), Math.max(videoTimeRange[1], audioTimeRange[1])];
      });

      _defineProperty(this, "isDraining", time => time > (this.timeRange[1] - this.timeRange[0]) / 4 + this.timeRange[0]);

      _defineProperty(this, "getFragmentPosition", time => {
        this.updateInterval(time);
        this.bufferStart = getBufferStart(this.mp4BoxTree, this.videoInterval.offsetInterVal[0], this.audioInterval.offsetInterVal[0]);
        const {
          videoSamples,
          audioSamples
        } = this.getSamples();
        const stcoBox = findBox(this.mp4BoxTree, 'videoStco');
        let videoSamplesStart = 0;

        if (videoSamples.length > 0) {
          videoSamplesStart = videoSamples[videoSamples.length - 1].start;
        }

        const isLastFragmentPosition = videoSamplesStart + videoSamples[videoSamples.length - 1].bufferStart === stcoBox.samples[stcoBox.samples.length - 1].chunkOffset;
        return getFragmentPosition(videoSamples, audioSamples, this.bufferStart, isLastFragmentPosition);
      });

      _defineProperty(this, "getSamples", () => {
        const videoSamples = getVideoSamples(this.mp4BoxTree, this.bufferStart, this.videoInterval.offsetInterVal);
        const audioSamples = getAudioSamples(this.mp4BoxTree, this.bufferStart, this.audioInterval.offsetInterVal);
        return {
          videoSamples,
          audioSamples
        };
      });

      _defineProperty(this, "getTrackInfo", mdatBuffer => {
        const {
          videoSamples,
          audioSamples
        } = this.getSamples();
        const videoTrackInfo = getVideoTrackInfo(videoSamples, mdatBuffer);
        const audioTrackInfo = getAudioTrackInfo(audioSamples, mdatBuffer);
        return {
          videoTrackInfo,
          audioTrackInfo
        };
      });

      this.mp4BoxTree = mp4BoxTree;
      this.mp4Data = {};
      this.init();
    }

    init() {
      this.getMP4Data();
    }

    getMP4Data() {
      const {
        duration,
        timescale
      } = findBox(this.mp4BoxTree, 'mvhd');
      const {
        channelCount,
        sampleRate
      } = findBox(this.mp4BoxTree, 'mp4a');
      const {
        timescale: audioTimescale,
        duration: audioDuration
      } = findBox(this.mp4BoxTree, 'audioMdhd');
      const {
        ESDescrTag: {
          DecSpecificDescrTag: {
            audioConfig
          }
        }
      } = findBox(this.mp4BoxTree, 'esds');
      this.mp4Data = {
        duration,
        timescale,
        channelCount,
        sampleRate,
        audioConfig,
        audioDuration,
        audioTimescale
      };
      const hasVideoStream = findBox(this.mp4BoxTree, 'videoTrak');

      if (hasVideoStream) {
        const {
          width,
          height
        } = findBox(this.mp4BoxTree, 'videoTkhd');
        const {
          samples
        } = findBox(this.mp4BoxTree, 'videoStsz');
        const {
          SPS,
          PPS
        } = findBox(this.mp4BoxTree, 'avcC');
        const {
          timescale: videoTimescale,
          duration: videoDuration
        } = findBox(this.mp4BoxTree, 'videoMdhd');
        this.mp4Data = { ...this.mp4Data,
          width,
          height,
          SPS,
          PPS,
          videoDuration,
          videoTimescale,
          videoSamplesLength: samples.length
        };
      }
    }

  }

  function generateVersionAndFlags(version, flag) {
    return new Uint8Array([version & 0xff, flag >> 16 & 0xff, flag >> 8 & 0xff, flag & 0xff]);
  }

  function concatTypedArray(...arrays) {
    let totalLength = 0;

    for (const arr of arrays) {
      totalLength += arr.length;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }

    return result;
  }

  function num2FourBytes(num) {
    return new Uint8Array([num >>> 24 & 0xff, num >>> 16 & 0xff, num >>> 8 & 0xff, num & 0xff]);
  }
  function num2EightBytes(num) {
    const upper = num / Math.pow(2, 32);
    const lower = num % Math.pow(2, 32);
    return new Uint8Array([upper >>> 24 & 0xff, upper >>> 16 & 0xff, upper >>> 8 & 0xff, upper & 0xff, lower >>> 24 & 0xff, lower >>> 16 & 0xff, lower >>> 8 & 0xff, lower & 0xff]);
  }

  const char2Hex = char => char.charCodeAt();

  const str2TypedArray = str => {
    // 字符串转 uint8 array
    return new Uint8Array(Array.prototype.map.call(str, char2Hex));
  };

  function generateBox(type, content) {
    return concatTypedArray(num2FourBytes(content.length + 8), str2TypedArray(type), content);
  }

  function generatePredefined(length) {
    return generateZeroBytes(length);
  }
  function generateReserved(length) {
    return generateZeroBytes(length);
  }

  function generateZeroBytes(bytes) {
    return new Uint8Array(bytes);
  }

  var ftyp$1 = (() => {
    const content = new Uint8Array([0x69, 0x73, 0x6F, 0x6D, // major_brand: isom
    0x00, 0x00, 0x00, 0x01, // minor_version: 0x01
    0x69, 0x73, 0x6F, 0x6D, // isom
    0x61, 0x76, 0x63, 0x31]);
    return generateBox('ftyp', content);
  });

  // prettier-ignore
  const MATRIX_TYPED_ARRAY = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00]);

  function mvhd$1(data) {
    const {
      duration,
      timescale
    } = data; // prettier-ignore

    const content = new Uint8Array([0x01, 0x00, 0x00, 0x00, // version、flags
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // creation_time
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // modification_time
    ...num2FourBytes(timescale), // timescale **
    ...num2EightBytes(duration), 0x00, 0x01, 0x00, 0x00, // 1.0 rate
    0x01, 0x00, // 1.0 volume
    ...generateReserved(10), ...MATRIX_TYPED_ARRAY, ...generatePredefined(24), // pre_defined
    0xff, 0xff, 0xff, 0xff // next_track_ID
    ]);
    return generateBox('mvhd', content);
  }

  function tkhd$1(data) {
    const {
      type,
      duration,
      width,
      height
    } = data; // prettier-ignore

    const content = new Uint8Array([...generateVersionAndFlags(1, 7), // version & flags
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // creation_time
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // modification_time
    ...num2FourBytes(type === 'video' ? 1 : 2), // track_ID **
    ...generateReserved(4), ...num2EightBytes(duration), ...generateReserved(8), 0x00, 0x00, // layer
    0x00, 0x00, // alternate_group
    0x00, 0x00, // volume
    0x00, 0x00, // reserved
    ...MATRIX_TYPED_ARRAY, width >> 8 & 0xff, width & 0xff, 0x00, 0x00, height >> 8 & 0xff, height & 0xff, 0x00, 0x00]);
    return generateBox('tkhd', content);
  }

  function mdhd$2(data) {
    const {
      type
    } = data;
    let duration;
    let timescale;

    if (type === 'video') {
      duration = data.videoDuration;
      timescale = data.videoTimescale;
    } else {
      duration = data.audioDuration;
      timescale = data.audioTimescale;
    } // prettier-ignore


    const content = new Uint8Array([...generateVersionAndFlags(1, 0), 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // creation_time
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // modification_time
    ...num2FourBytes(timescale), // timescale **
    ...num2EightBytes(duration), // duration 
    0x55, 0xc4, // language
    0x00, 0x00]);
    return generateBox('mdhd', content);
  }

  function hdlr$1(type) {
    let handler = '';
    let name = '';

    switch (type) {
      case 'video':
        handler = 'vide';
        name = 'VideoHandler';
        break;

      case 'audio':
        handler = 'soun';
        name = 'SoundHandler';
    } // prettier-ignore


    const content = new Uint8Array([...generateVersionAndFlags(0, 0), ...generatePredefined(4), ...str2TypedArray(handler), // **
    ...generateReserved(12), ...str2TypedArray(name), 0x00]);
    return generateBox('hdlr', content);
  }

  function vmhd$1() {
    // prettier-ignore
    const content = new Uint8Array([...generateVersionAndFlags(0, 1), // version(0) + flags
    0x00, 0x00, // graphicsmode: 2 bytes
    0x00, 0x00, 0x00, 0x00, // opcolor: 3 * 2 bytes
    0x00, 0x00]);
    return generateBox('vmhd', content);
  }

  function smhd$1() {
    // prettier-ignore
    const content = [...generateVersionAndFlags(0, 0), 0x00, 0x00, 0x00, 0x00 // balance(2) + reserved(2)
    ];
    return generateBox('smhd', content);
  }

  function dinf() {
    return generateBox('dinf', dref$1());
  }

  function dref$1() {
    // prettier-ignore
    const content = concatTypedArray(new Uint8Array([...generateVersionAndFlags(0, 0), 0x00, 0x00, 0x00, 0x01]), url$1());
    return generateBox('dref', content);
  }

  function url$1() {
    // prettier-ignore
    return generateBox('url ', [0x00, 0x00, 0x00, 0x01]);
  }

  function avcC$1(data) {
    const {
      SPS,
      PPS
    } = data; // prettier-ignore

    const content = new Uint8Array([0x01, // configurationVersion
    SPS[1], // AVCProfileIndication
    SPS[2], // profile_compatibility,
    SPS[3], // AVCLevelIndication
    0xfc | 3, // lengthSizeMinusOne`
    0xE0 | 1, // 目前只处理一个sps **
    SPS.length >> 8 & 0xff, SPS.length & 0xff, ...SPS, 0x01, PPS.length >> 8 & 0xff, PPS.length & 0xff, ...PPS]);
    return generateBox('avcC', content);
  }

  function acv1(data) {
    const {
      width,
      height
    } = data; // prettier-ignore

    let content = new Uint8Array([...generateReserved(6), 0x00, 0x01, // data_reference_index
    ...generatePredefined(16), width >> 8 & 0xff, width & 0xff, height >> 8 & 0xff, height & 0xff, // width & height
    0x00, 0x48, 0x00, 0x00, // horizresolution
    0x00, 0x48, 0x00, 0x00, // vertresolution
    ...generateReserved(4), 0x00, 0x01, // frame_count
    0x0B, 0x57, 0x41, 0x4E, 0x47, 0x4C, 0x75, 0x76, 0X44, 0x41, 0x4E, 0x47, ...generatePredefined(20), 0x00, 0x18, // depth
    // 设置成 0x00, 0x00 的话 safari 无法正常播放。
    0xff, 0xff]);
    content = concatTypedArray(content, avcC$1(data));
    return generateBox('avc1', content);
  }

  function esds$1(data) {
    const {
      audioConfig: config = [43, 146, 8, 0]
    } = data; // prettier-ignore

    const content = new Uint8Array([...generateVersionAndFlags(0, 0), 0x03, // DecoderSpecificInfo
    0x17 + config.length, // length
    0x00, 0x01, // es_id
    0x00, // stream_priority
    0x04, // DecoderConfigDescrTag
    0x0f + config.length, // length
    0x40, // codec
    0x15, // stream_type
    0x00, 0x00, 0x00, // buffer_size
    0x00, 0x00, 0x00, 0x00, // maxBitrate
    0x00, 0x00, 0x00, 0x00, // avgBitrate
    0x05, // DecSpecificInfoTag
    config.length, // configlen
    ...config, 0x06, 0x01, 0x02]);
    return generateBox('esds', content);
  }

  function mp4a$1(data) {
    const {
      channelCount,
      sampleRate
    } = data; // prettier-ignore

    let content = new Uint8Array([...generateReserved(6), 0x00, 0x01, // data_reference_index
    ...generateReserved(8), 0x00, channelCount, 0x00, 0x10, // sampleSize
    ...generateReserved(4), sampleRate >> 8 & 0xFF, // Audio sample rate
    sampleRate & 0xFF, 0x00, 0x00]);
    content = concatTypedArray(content, esds$1(data));
    return generateBox('mp4a', content);
  }

  function stsd$1(data) {
    const {
      type
    } = data;
    let content;

    if (type === 'video') {
      content = acv1(data);
    } else if (type === 'audio') {
      content = mp4a$1(data);
    }

    content = concatTypedArray( // prettier-ignore
    new Uint8Array([...generateVersionAndFlags(0, 0), // version & flags
    0x00, 0x00, 0x00, 0x01 // entry_count
    ]), content);
    return generateBox('stsd', content);
  }

  function stbl(data) {
    const content = concatTypedArray(stsd$1(data), stts$1(), stsc(), stsz(), stco$1());
    return generateBox('stbl', content);
  }

  const stsz = () => {
    // prettier-ignore
    const content = new Uint8Array([...generateVersionAndFlags(0, 0), // version(0) + flags
    0x00, 0x00, 0x00, 0x00, // sample_size
    0x00, 0x00, 0x00, 0x00 // sample_count
    ]);
    return generateBox('stsz', content);
  };

  const stsc = () => {
    // prettier-ignore
    const content = new Uint8Array([...generateVersionAndFlags(0, 0), // version(0) + flags
    0x00, 0x00, 0x00, 0x00]);
    return generateBox('stsc', content);
  };

  const stts$1 = () => {
    // prettier-ignore
    const content = new Uint8Array([...generateVersionAndFlags(0, 0), // version(0) + flags
    0x00, 0x00, 0x00, 0x00]);
    return generateBox('stts', content);
  };

  const stco$1 = () => {
    // prettier-ignore
    const content = new Uint8Array([...generateVersionAndFlags(0, 0), // version(0) + flags
    0x00, 0x00, 0x00, 0x00]);
    return generateBox('stco', content);
  };

  function minf(data) {
    const {
      type
    } = data;
    let header = '';

    switch (type) {
      case 'video':
        header = vmhd$1();
        break;

      case 'audio':
        header = smhd$1();
        break;
    }

    const content = concatTypedArray(header, dinf(), stbl(data));
    return generateBox('minf', content);
  }

  function mdia(data) {
    const content = concatTypedArray(mdhd$2(data), hdlr$1(data.type), minf(data));
    return generateBox('mdia', content);
  }

  function trak(data) {
    const content = concatTypedArray(tkhd$1(data), mdia(data));
    return generateBox('trak', content);
  }

  function mvex(data) {
    const content = concatTypedArray(mehd(data), trex(1), trex(2));
    return generateBox('mvex', content);
  }
  function mehd(data) {
    const {
      duration
    } = data; // prettier-ignore

    const content = new Uint8Array([...generateVersionAndFlags(0, 0), ...num2FourBytes(duration)]);
    return generateBox('mehd', content);
  }
  function trex(trackId) {
    // prettier-ignore
    const content = new Uint8Array([...generateVersionAndFlags(0, 0), // version & flags
    ...num2FourBytes(trackId), 0x00, 0x00, 0x00, 0x01, // default_sample_description_index
    0x00, 0x00, 0x00, 0x00, // default_sample_duration
    0x00, 0x00, 0x00, 0x00, // default_sample_size
    0x00, 0x01, 0x00, 0x01 // default_sample_flags
    ]);
    return generateBox('trex', content);
  }

  function moov(data) {
    const content = concatTypedArray(mvhd$1(data), trak({ ...data,
      type: 'video'
    }), trak({ ...data,
      type: 'audio'
    }), mvex(data));
    return generateBox('moov', content);
  }

  function mfhd(data) {
    const {
      sequenceNumber
    } = data; // prettier-ignore

    const content = new Uint8Array([...generateVersionAndFlags(0, 0), ...num2FourBytes(sequenceNumber)]);
    return generateBox('mfhd', content);
  }

  function tfhd(data) {
    const {
      trackId
    } = data; // prettier-ignore

    return generateBox('tfhd', new Uint8Array([...generateVersionAndFlags(0, 0), // version & flags
    ...num2FourBytes(trackId)]));
  }

  function sdtp$1(data) {
    const {
      samples
    } = data;
    const content = concatTypedArray([0x00, 0x00, 0x00, 0x00], ...samples.map(() => new Uint8Array([0x10])) // FIXME: need sample flags
    );
    return generateBox('sdtp', content);
  }

  function tfdt(data) {
    const {
      baseMediaDecodeTime
    } = data; // prettier-ignore

    const content = new Uint8Array([...generateVersionAndFlags(1, 0), //  version & flag
    0x00, 0x00, 0x00, 0x00, baseMediaDecodeTime >>> 24 & 0xFF, // baseMediaDecodeTime: int32
    baseMediaDecodeTime >>> 16 & 0xFF, baseMediaDecodeTime >>> 8 & 0xFF, baseMediaDecodeTime & 0xFF]);
    return generateBox('tfdt', content);
  }

  function trun(data) {
    const {
      samples,
      trackId
    } = data;
    const ceil = trackId === 1 ? 16 : 12;
    const length = samples.length; // mdat-header 8
    // moof-header 8
    // mfhd 16
    // traf-header 8
    // thhd 16
    // tfdt 20
    // trun-header 12
    // sampleCount 4
    // data-offset 4
    // samples.length
    // sdtp-header 12

    const offset = 108 + ceil * length + samples.length; // prettier-ignore

    const content = new Uint8Array([0x00, 0x00, trackId === 1 ? 0x0f : 0x07, 0x01, ...num2FourBytes(samples.length), ...num2FourBytes(offset), ...concatTypedArray(...samples.map((sample, index) => {
      const {
        duration,
        size,
        compositionTimeOffset
      } = sample;
      return concatTypedArray(num2FourBytes(duration), num2FourBytes(size), trackId === 1 ? index === 0 // FIXME:need sample flags
      ? [0x02, 0x00, 0x00, 0x00] : [0x01, 0x01, 0x00, 0x00] : [0x01, 0x00, 0x00, 0x00], trackId === 1 ? num2FourBytes(compositionTimeOffset) : []);
    }))]);
    return generateBox('trun', content);
  }

  function traf(data) {
    const content = concatTypedArray(tfhd(data), tfdt(data), sdtp$1(data), trun(data));
    return generateBox('traf', content);
  }

  function moof(data) {
    const content = concatTypedArray(mfhd(data), traf(data));
    return generateBox('moof', content);
  }

  function mdat$1(data) {
    return generateBox('mdat', data);
  }

  class FMP4Generator {
    static ftyp() {
      return ftyp$1();
    }

    static moov(data) {
      return moov(data);
    }

    static moof(trackInfo, baseMediaDecodeTime) {
      return moof(Object.assign({}, trackInfo, {
        sequenceNumber: FMP4Generator.sequenceNumber++,
        baseMediaDecodeTime
      }));
    }

    static mdat(trackInfo) {
      const samples = trackInfo.samples.map(sample => new Uint8Array(sample.buffer));
      return mdat$1(concatTypedArray(...samples));
    }

  }

  _defineProperty(FMP4Generator, "sequenceNumber", 1);

  var videoRawData = [];
  var audioRawData = [];
  var mp4Probe = null;
  var buffer = null;
  var currentStart = 0;
  var currentEnd = 0;

  var seek = function (time) {
    const [start, end] = mp4Probe.getFragmentPosition(time);

    if (start == currentStart || end == currentEnd) {
      return;
    }

    currentStart = start;
    currentEnd = end;
    var mdatBuffer = buffer.slice(start, end);
    const {
      videoTrackInfo,
      audioTrackInfo
    } = mp4Probe.getTrackInfo(mdatBuffer);
    const {
      videoInterval,
      audioInterval
    } = mp4Probe;
    const videoBaseMediaDecodeTime = videoInterval.timeInterVal[0];
    const audioBaseMediaDecodeTime = audioInterval.timeInterVal[0];
    videoRawData = concatTypedArray(videoRawData, FMP4Generator.moof(videoTrackInfo, videoBaseMediaDecodeTime), FMP4Generator.mdat(videoTrackInfo)); // maybe the last GOP dont have audio track
    // 最后一个 GOP 序列可能没有音频轨

    if (audioTrackInfo.samples.length !== 0) {
      audioRawData = concatTypedArray(audioRawData, FMP4Generator.moof(audioTrackInfo, audioBaseMediaDecodeTime), FMP4Generator.mdat(audioTrackInfo));
    }

    seek();
  };

  var detach = function (b) {
    buffer = b;
    var mp4BoxTreeObject = new MP4Parse(new Uint8Array(buffer)).mp4BoxTreeObject;
    mp4Probe = new MP4Probe(mp4BoxTreeObject);
    const RawData = concatTypedArray(FMP4Generator.ftyp(), FMP4Generator.moov(mp4Probe.mp4Data));
    seek(0);
    return concatTypedArray(RawData, videoRawData, audioRawData);
  };

  return detach;

}));
