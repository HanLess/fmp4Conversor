import MP4Parse from './mp4/mp4Parse'
import MP4Probe from './mp4/mp4Probe'
import FMP4 from './fmp4/fmp4Generator'
import {concatTypedArray} from './fmp4/utils'
var detach = function (buffer) {
    var mp4BoxTreeObject = new MP4Parse(new Uint8Array(buffer)).mp4BoxTreeObject
    var mp4Probe = new MP4Probe(mp4BoxTreeObject)
    var mp4BoxTreeObject = mp4BoxTreeObject

    const RawData = concatTypedArray(
        FMP4.ftyp(),
        FMP4.moov(mp4Probe.mp4Data)
    )
    const [start, end] = mp4Probe.getFragmentPosition(0);
    var mdatBuffer = buffer.slice(start);
    const {videoTrackInfo, audioTrackInfo} = mp4Probe.getTrackInfo(
        mdatBuffer
    )
    const {videoInterval, audioInterval} = mp4Probe
    const videoBaseMediaDecodeTime = videoInterval.timeInterVal[0]
    const audioBaseMediaDecodeTime = audioInterval.timeInterVal[0]
    const videoRawData = concatTypedArray(
        FMP4.moof(videoTrackInfo, videoBaseMediaDecodeTime),
        FMP4.mdat(videoTrackInfo)
    )
    console.log('videoRawData ---- ',videoRawData.length)
    
    var audioRawData = [];

      // maybe the last GOP dont have audio track
      // 最后一个 GOP 序列可能没有音频轨
    if (audioTrackInfo.samples.length !== 0) {
        audioRawData = concatTypedArray(
            FMP4.moof(audioTrackInfo, audioBaseMediaDecodeTime),
            FMP4.mdat(audioTrackInfo)
        )   
    }
    console.log('audioRawData ---- ',audioRawData.length)

    return concatTypedArray(
        RawData,
        videoRawData,
        audioRawData
    )
}

export default detach;