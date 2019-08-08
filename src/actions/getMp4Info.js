import MP4Parse from './mp4/mp4Parse'
import MP4Probe from './mp4/mp4Probe'
import FMP4 from './fmp4/fmp4Generator'
import {concatTypedArray} from './fmp4/utils'

var videoRawData = [];
var audioRawData = [];
var mp4Probe = null;
var buffer = null;
var currentStart = 0;
var currentEnd = 0;


var seek = function (time) {
    const [start, end] = mp4Probe.getFragmentPosition(time);

    if (start == currentStart || end == currentEnd) {
        return
    }

    currentStart = start
    currentEnd = end

    var mdatBuffer = buffer.slice(start,end);
    const {videoTrackInfo, audioTrackInfo} = mp4Probe.getTrackInfo(
        mdatBuffer
    )
    const {videoInterval, audioInterval} = mp4Probe
    const videoBaseMediaDecodeTime = videoInterval.timeInterVal[0]
    const audioBaseMediaDecodeTime = audioInterval.timeInterVal[0]
    videoRawData = concatTypedArray(
        videoRawData,
        FMP4.moof(videoTrackInfo, videoBaseMediaDecodeTime),
        FMP4.mdat(videoTrackInfo)
    )
      // maybe the last GOP dont have audio track
      // 最后一个 GOP 序列可能没有音频轨
    if (audioTrackInfo.samples.length !== 0) {
        audioRawData = concatTypedArray(
            audioRawData,
            FMP4.moof(audioTrackInfo, audioBaseMediaDecodeTime),
            FMP4.mdat(audioTrackInfo)
        )   
    }
    seek();
}

var detach = function (b) {
    buffer = b;
    var mp4BoxTreeObject = new MP4Parse(new Uint8Array(buffer)).mp4BoxTreeObject
    mp4Probe = new MP4Probe(mp4BoxTreeObject)

    const RawData = concatTypedArray(
        FMP4.ftyp(),
        FMP4.moov(mp4Probe.mp4Data)
    )
    
    seek(0)

    return concatTypedArray(
        RawData,
        videoRawData,
        audioRawData
    )
}

export default detach;