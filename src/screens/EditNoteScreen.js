import React from 'react';
import {
	SafeAreaView, View, Text, TouchableOpacity, FlatList, TextInput, Alert, Keyboard,
} from 'react-native';
import SQLite from "react-native-sqlite-storage";
import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';

import getStyleSheet, { COLORS } from '../values/styles';
import IconIonicons from 'react-native-vector-icons/Ionicons';

const db = SQLite.openDatabase({ name: 'ChoreoNote.db' });

export default class EditNoteScreen extends React.Component {
	state = {
		noteInfo: undefined,
		dancerNum: 2,
		musicList: [],
		selectedMusicPath: '/',
		playingMusicIdx: -1,
		isValidTitle: true,
		isValidDancerNum: true,
		isValidMusic: false,
	}

	musicLoad = () => {
		RNFS.readDir(RNFS.DocumentDirectoryPath).then(files => {
			
			const musicList = [];
			musicList.push({ name: '없음', path: '/' });
			files.forEach(file => {
				musicList.push({ name: file.name, path: file.path });
				console.log('name:', file.name);
			});
			this.setState({ musicList });
		});
	}

	musicPlay = (path, idx) => {
		const { playingMusicIdx } = this.state;
		
		if(this.sound)
		this.sound.pause();

		if(playingMusicIdx == idx) {
			this.setState({ playingMusicIdx: -1 });
		}
		else {
			this.setState({ playingMusicIdx: idx });

			this.sound = new Sound(encodeURI(path), '/', (error) => {
				if (error)
				console.log('MUSIC LOAD FAIL', error);
				else {
					console.log('MUSIC LOAD SUCCESS:', Math.ceil(this.sound.getDuration()));
					this.sound.play(() => {
						this.sound.pause();
						this.setState({ playingMusicIdx: -1 });
					});
				}
			});
		}
	}

	selectMusic = (path) => {

		this.setState({ selectedMusicPath: path, isValidMusic: path == '' ? false : true });
	}

	goToFormationScreen = () => {
		const { noteInfo: { nid, title }, dancerNum, musicList, selectedMusicPath, isValidTitle, isValidDancerNum } = this.state;
		const { getTodayDate, updateStateFromDB } = this.props.route.params;

		Keyboard.dismiss();

		if(!isValidTitle)
		Alert.alert('노트 제목', '제목을 입력해 주세요.');
		else if(!isValidDancerNum)
		Alert.alert('댄서 수', '댄서는 최소 1명, 최대 30명까지 가능합니다.');
		else {
			if(this.sound)
			this.sound.pause();
			// 노래 길이 계산
			this.sound = new Sound(encodeURI(selectedMusicPath), '/', (error) => {
				// 노래 가져오기 실패
				if (selectedMusicPath != '/' && error) {
					console.log('MUSIC LOAD FAIL', error);
					Alert.alert('노래 불러오기 실패', '노래를 불러올 수 없습니다.');
					return;
				}
				// 노래 가져오기 성공
				else {
					const musicLength = selectedMusicPath == '/' ? 60 : Math.ceil(this.sound.getDuration());
					const editDate = getTodayDate();
					
					console.log('MUSIC LOAD SUCCESS:', musicLength);

					db.transaction(async txn => {
						await txn.executeSql(
							"UPDATE notes " +
							"SET title=?, music=?, musicLength=?, editDate=? " +
							"WHERE nid=?",
							[title, selectedMusicPath, musicLength, editDate, nid],
							txn => {
								for(let did=0; did<dancerNum; did++) {
									const name = `댄서 ${did}`;
									const posx = dancerNum == 1 ? 0 : did * (200 / (dancerNum-1)) - 100;
									txn.executeSql(
										"INSERT INTO dancers VALUES (?, ?, ?, 0)",
										[nid, did, name]);
		
									txn.executeSql(
										"INSERT INTO positions VALUES (?, 0, ?, ?, 0)",
										[nid, did, posx]);
						
									txn.executeSql(
										"INSERT INTO positions VALUES (?, 5, ?, ?, -50)",
										[nid, did, posx]);
								}
					
								txn.executeSql(
									"INSERT INTO times VALUES (?, 0, 3)",
									[nid]);
		
								txn.executeSql(
									"INSERT INTO times VALUES (?, 5, 5)",
									[nid]);
							}
						);

						this.props.navigation.navigate('Formation', { 
							nid: nid,
							getTodayDate: getTodayDate,
							updateStateFromDB: updateStateFromDB,
						});
					},
					e => console.log("DB ERROR", e),
					(e) => console.log("DB SUCCESS", e));
				}
			});
		}
	}

	changeTitle = (event) => {
		const title = event.nativeEvent.text.trim();

		if(title == '') 
		this.setState({ isValidTitle: false });

		else {
			const noteInfo = {...this.state.noteInfo, title};
			this.setState({ noteInfo, isValidTitle: true });
		}
	}

	changeDancerNum = (event) => {
		const dancerNum = Number(event.nativeEvent.text);
		if(isNaN(dancerNum) || dancerNum <= 0 || dancerNum > 30)
		this.setState({ isValidDancerNum: false });

		else
		this.setState({ dancerNum, isValidDancerNum: true });
	}

	componentDidMount() {
		const { nid } = this.props.route.params;

		this.musicLoad();

		db.transaction(txn => {
      txn.executeSql(
				"SELECT * FROM notes WHERE nid = ?",
				[nid],
        (txn, result) => {
					const noteInfo = result.rows.item(0);
					console.log(noteInfo);
					this.setState({ noteInfo });
				}
			);
		});
	}

	// <FlatList> 구분선
	listViewItemSeparator = () => 
	<View style={getStyleSheet().itemSeparator} />

	render() {
		console.log('render');
		const { noteInfo, dancerNum, musicList, selectedMusicPath, playingMusicIdx,
			isValidTitle, isValidDancerNum, isValidMusic } = this.state;
		const {
			changeTitle,
			changeDancerNum,
			musicPlay,
			selectMusic,
			goToFormationScreen,
		} = this;
		const styles = getStyleSheet();

		if(noteInfo == undefined)
		return null;

		return(
			<View style={styles.bg}>
			<SafeAreaView style={styles.bg}>
			<TouchableOpacity 
			style={{flex: 1}} 
			onPress={Keyboard.dismiss}
			activeOpacity={1}>

				{/* Tool Bar */}
				<View style={styles.toolbar}>
					<View style={{flexDirection: 'row', alignItems: 'center'}}>
						<TouchableOpacity onPress={() => this.props.navigation.goBack()}>
							<IconIonicons name="chevron-back" size={20} style={styles.toolbarButton} />
						</TouchableOpacity>
						<Text style={styles.toolbarTitle}>Edit Note</Text>
					</View>
					<TouchableOpacity
					onPress={() => goToFormationScreen()}>
						<Text style={styles.toolbarText}>확인</Text>
					</TouchableOpacity>
				</View>

				<View style={{flex: 1, padding: 30}}>
					<View style={{flexDirection: 'row', alignItems: 'center'}}>
						<Text style={styles.editNote__title}>노트 이름</Text>
						<View style={[styles.editNote__flag, {backgroundColor: isValidTitle ? COLORS.green : COLORS.red}]} />
						<Text style={{color: COLORS.red}}>{isValidTitle ? '' : '제목은 공백일 수 없어요.'}</Text>
					</View>
					<TextInput
					style={styles.editNote__input}
					maxLength={30}
					placeholder="노트 제목을 입력해 주세요."
					placeholderTextColor={COLORS.grayDark}
					onChange={event => changeTitle(event)}
					autoCorrect={false}>
						{noteInfo.title}
					</TextInput>

					<View style={{flexDirection: 'row', alignItems: 'center'}}>
						<Text style={styles.editNote__title}>댄서 명 수 (최대 30명)</Text>
						<View style={[styles.editNote__flag, {backgroundColor: isValidDancerNum ? COLORS.green : COLORS.red}]} />
						<Text style={{color: COLORS.red}}>{isValidDancerNum ? '' : '1~30 숫자이어야 합니다.'}</Text>
					</View>
					<TextInput
					style={styles.editNote__input}
					maxLength={4}
					placeholder={'0'}
					placeholderTextColor={COLORS.grayDark}
					keyboardType={'number-pad'}
					onChange={event => changeDancerNum(event)}>{dancerNum}</TextInput>

					<View style={{flexDirection: 'row', alignItems: 'center'}}>
						<Text style={styles.editNote__title}>노래</Text>
						<View style={[styles.editNote__flag, {backgroundColor: isValidMusic ? COLORS.green : COLORS.yellow}]} />
						<Text style={{color: COLORS.yellow}}>{isValidMusic ? '' : '선택하지 않으면 1분 무음으로 설정됩니다.'}</Text>
					</View>

					<FlatList
					// style={styles.editNote__musicList}
					data={musicList}
					keyExtractor={(item, idx) => idx.toString()}
					ItemSeparatorComponent={this.listViewItemSeparator}
					renderItem={({ item, index }) =>
					<View style={styles.editNote__musicEntry}>
						<TouchableOpacity
						style={{flex: 1, height: '100%', paddingRight: 10, justifyContent: 'center'}}
						onPress={() => selectMusic(item.path)}>
							<Text numberOfLines={2} style={[styles.dancerEntry__text], {color: selectedMusicPath == item.path ? COLORS.green : COLORS.white}}>
								{item.name}
							</Text>
						</TouchableOpacity>
						{index == 0 ? null :
						<TouchableOpacity
						onPress={() => musicPlay(item.path, index)}>
							<IconIonicons name={playingMusicIdx == index ? "pause" : "play"} size={20} style={styles.editNote__btn} />
						</TouchableOpacity>
						}
					</View>
					} />
				</View>
			</TouchableOpacity>
			</SafeAreaView>
			</View>
		)
	}
}