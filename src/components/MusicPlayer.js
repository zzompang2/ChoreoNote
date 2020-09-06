import React from "react"
import { 
	View, TouchableOpacity, Image, Text, StyleSheet,
} from "react-native"
import Sound from 'react-native-sound';
// Enable playback in silence mode
Sound.setCategory('Playback');
import IconIonicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {COLORS} from '../values/Colors'
import { DebugInstructions } from "react-native/Libraries/NewAppScreen"

const TAG = "MusicPlayer/";

export default class MusicPlayer extends React.Component{
	constructor(props){
    super(props);
    console.log(TAG, "constructor");
    this.state = {
			noteInfo: this.props.noteInfo,
			beat: this.props.beat,
			isPlay: false,
		}
		this.BPM = this.state.noteInfo.bpm;
	}

	// Seek to a specific point in seconds
	// this.sound.setCurrentTime(2.5);
	
	// Get the current playback point in seconds
	// this.sound.getCurrentTime((seconds) => console.log('at ' + seconds));
		
	// Release the audio player resource
	// this.sound.release();

	// Load the sound file '[your_music_title].mp3' from the app bundle
	// See notes below about preloading sounds within initialization code below.
	load = () => {
		console.log(TAG, 'load');
		// console.log(Sound.MAIN_BUNDLE);
		// console.log(Sound.DOCUMENT);
		// console.log(Sound.LIBRARY);
		// console.log(Sound.CACHES);
		
		let fileName;
		let filePath;

		if(this.state.noteInfo.music == 'Sample'){
			fileName = 'Sample.mp3';
			filePath = Sound.MAIN_BUNDLE;
		}
		else{
			fileName = this.state.noteInfo.music;
			filePath = Sound.DOCUMENT;
		}
		
		this.sound = new Sound(fileName, filePath, (error) => {
			if (error) {
				console.log('failed to load the sound', error);
				return;
			}
			// this.sound == TRUE
			// loaded successfully!
			console.log('duration in seconds: ' + this.sound.getDuration(), 'number of channels: ' + this.sound.getNumberOfChannels());
		});
		// Reduce the volume by half
		// this.sound.setVolume(1);

		// Set the pan value.
		// Position the sound to the full right in a stereo field
		// ranging from -1.0 (full left) through 1.0 (full right).
		// this.sound.setPan(1);
		
		// Loop indefinitely until stop() is called
		// this.sound.setNumberOfLoops(-1);
	}

	// Play the sound with an onEnd callback
	play = () => {
		console.log(TAG, "play");

		// 음악이 load되지 않은 경우
		// 음악이 이미 플레이 중인 경우
		if(!this.sound || this.state.isPlay) return;
		// // state의 시간값과 맞추기
		this.sound.setCurrentTime(this.state.beat * 60/this.BPM);
		this.sound.play(this.playComplete);

		this.props.onPlaySubmit(this.state.beat, true);
		
		this.interval = setInterval(() => {	
			// 다음 beat으로 체크마크 붙이기
			// this.setBeatBoxViewsWithMark(this.state.beat+1);

			// beat에 맞게 scroll view를 강제 scroll하기
			// this.scrollHorizontal.scrollToIndex({animated: false, index: this.state.beat+1});
			// state 값 업데이트
			this.sound.getCurrentTime((sec, isPlaying) => {
				const changedBeat = sec*this.BPM/60;
				this.props.onPlaySubmit(Math.round(changedBeat));
				this.setState({beat: changedBeat});
			});
		}, 
		1000*60/this.BPM
		);

		// 애니메이션 재생
		this.setState({isPlay: true});
	}

	playComplete = (success) => {
    //console.log(this.TAG + "playComplete");
    if(this.sound){
      if (success) {
        console.log('successfully finished playing');
      } else {
        console.log('playback failed due to audio decoding errors');
        //Alert.alert('Notice', 'audio file error. (Error code : 2)');
      }
      this.setState({isPlay: false, beat: 0});
			this.sound.setCurrentTime(0);
			this.pause();
    }
  }
	
	pause = () => {
		console.log(TAG, "pause");
		clearInterval(this.interval);
	
		// music pause
		this.sound.pause();
		this.props.onPlaySubmit(this.state.beat, false);
		
		// state 변경 후 dancer 위치 업데이트
		this.setState({isPlay: false});
	}

	jumpTo = (beat) => {
		console.log(TAG, 'jumpTo', beat);
		let destination = this.state.beat + beat;
		if(destination < 0) destination = 0;
		else if (destination > this.state.noteInfo.musicLength/60*this.state.noteInfo.bpm) 
			destination = this.state.noteInfo.musicLength/60*this.state.noteInfo.bpm;

		this.props.onPlaySubmit(destination);
		this.setState({beat: destination});
	}

	// Stop the sound and rewind to the beginning
	stop = () => {
		console.log(TAG, 'stop');
		this.sound.stop(() => {
			// Note: If you want to play a sound after stopping and rewinding it,
			// it is important to call play() in a callback.
			this.sound.play();
		});
	}
	
	/** 초(sec) => "분:초" 변환한다.
	 * - re-render: NO
	 * @param {number} sec 
	 * @returns {string} 'min:sec'
	 */
	timeFormat = (beat) => {
		console.log(TAG, 'timeFormat(', beat, ')');
		console.log(Math.floor(beat/this.state.noteInfo.bpm) + ':' + Math.floor((beat*60/this.state.noteInfo.bpm)%60) )
		return(
			Math.floor(beat/this.state.noteInfo.bpm) + ':' +  
			(Math.floor((beat*60/this.state.noteInfo.bpm)%60) < 10 ? '0' : '') +
			Math.floor((beat*60/this.state.noteInfo.bpm)%60) 
		)
	}

	componentDidMount(){
		console.log(TAG, "componentDidMount");
		this.load();
	}
	
	componentDidUpdate(){
		console.log(TAG, "componentDidUpdate");
		// this.setState({beat: this.props.beat})
	}

  render(){
    console.log(TAG, "render");

		if(this.state.beat != this.props.beat) this.setState({beat: this.props.beat});
		const buttonColor = this.state.isPlay ? COLORS.grayMiddle : COLORS.blackDark;

    return (
			<View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>

				<Text style={{flex: 1, width: 40, fontSize: 14, textAlign: 'center'}}>{this.timeFormat(this.state.beat)}</Text>

				<TouchableOpacity onPress={()=>this.jumpTo(-30)} 
				disabled={this.state.isPlay} style={{margin: 10}} activeOpacity={.7}>
					<MaterialCommunityIcons name='rewind-30' size={28} color={buttonColor}/>
				</TouchableOpacity>
				<TouchableOpacity onPress={()=>this.jumpTo(-10)} 
				disabled={this.state.isPlay} style={{margin: 10}} activeOpacity={.7}>
					<MaterialCommunityIcons name='rewind-10' size={28} color={buttonColor}/>
				</TouchableOpacity>

				{ this.state.isPlay ? 
				<TouchableOpacity onPress={()=>{this.pause()}} style={{margin: 1}} activeOpacity={.9}>
					<IconIonicons name="pause-circle-outline" size={40}/>
				</TouchableOpacity>
				:
				<TouchableOpacity onPress={()=>{this.play()}} style={{margin: 1}} activeOpacity={.9}>
					<IconIonicons name="play-circle" size={40}/>
				</TouchableOpacity>
				}

				<TouchableOpacity onPress={()=>this.jumpTo(10)} 
				disabled={this.state.isPlay} style={{margin: 10}} activeOpacity={.7}>
					<MaterialCommunityIcons name='fast-forward-10' size={28} color={buttonColor}/>
				</TouchableOpacity>
				<TouchableOpacity onPress={()=>this.jumpTo(30)} 
				disabled={this.state.isPlay} style={{margin: 10}} activeOpacity={.7}>
					<MaterialCommunityIcons name='fast-forward-30' size={28} color={buttonColor}/>
				</TouchableOpacity>

				<Text style={{flex: 1, width: 40, fontSize: 14, textAlign: 'center'}}>{this.timeFormat(this.state.noteInfo.musicLength/60*this.state.noteInfo.bpm)}</Text>

			</View>
    )
  }
}

const styles = StyleSheet.create({
	button: {
    width: 30,
    height: 30,
    marginTop: 10,
    marginRight: 10,
	},
});