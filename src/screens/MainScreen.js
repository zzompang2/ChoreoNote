import React from 'react';
import {
	SafeAreaView, View, Text, TouchableOpacity, FlatList, LogBox, Alert
} from 'react-native';
import SQLite from "react-native-sqlite-storage";
import NoteItem from '../components/NoteItem';
import getStyleSheet from '../values/styles';

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

const TAG = 'MainScreen/';
const db = SQLite.openDatabase({ name: 'ChoreoNote.db' });

export default class MainScreen extends React.Component {
	state = {
		notes: []
	};

	getDatabaseData() {
		const notes = [];

		db.transaction(txn => {
			/*=== 기존 TABLE 초기화(for debug) ===*/
			// txn.executeSql('DROP TABLE IF EXISTS metadata');
			// txn.executeSql('DROP TABLE IF EXISTS notes');
			// txn.executeSql('DROP TABLE IF EXISTS dancers');
			// txn.executeSql('DROP TABLE IF EXISTS times');
			// txn.executeSql('DROP TABLE IF EXISTS positions');

			// 노트 개수가 0개이면 디폴트 노트 생성
			txn.executeSql(
				'SELECT COUNT(*) FROM sqlite_master WHERE name = ?',
				["notes"],
				(txn, result) => {
					// DB 에 notes 테이블이 없는 경우 (앱 최초 실행),
					// default note 를 생성
					const countResult = result.rows.item(0)["COUNT(*)"];
					if(countResult == 0) {
						txn.executeSql(
							"INSERT INTO metadata VALUES (0, 0)", []);

						const title = 'Welcome to Choreo Note!';
						const createDate = this.getTodayDate();
						const stageRatio = 2;
						const music = '/';
						const musicLength = 60;
						const displayName = 0;

						notes.push({ nid: 0, title, createDate, editDate: createDate, music });
						this.setState({ notes });

						txn.executeSql(
							"INSERT INTO notes VALUES (0, ?, ?, ?, ?, ?, ?, ?)",
							[title, createDate, createDate, stageRatio, music, musicLength, displayName]);
						txn.executeSql(
							"INSERT INTO dancers VALUES (0, 0, 'Ham', 0)", []);
			
						txn.executeSql(
							"INSERT INTO dancers VALUES (0, 1, 'Changsu', 1)", []);
			
						txn.executeSql(
							"INSERT INTO times VALUES (0, 0, 2000)", []);

						txn.executeSql(
							"INSERT INTO times VALUES (0, 5000, 3000)", []);
			
						txn.executeSql(
							"INSERT INTO positions VALUES (0, 0, 0, -500, 0)", []);
			
						txn.executeSql(
							"INSERT INTO positions VALUES (0, 0, 1, 500, 0)", []);

						txn.executeSql(
							"INSERT INTO positions VALUES (0, 5000, 0, 0, 100)", []);
			
						txn.executeSql(
							"INSERT INTO positions VALUES (0, 5000, 1, 0, -100)", []);
					}
				}
			);

			/*=== TABLE 생성 ===*/
			txn.executeSql(
				'CREATE TABLE IF NOT EXISTS metadata(' +
				'id INTEGER NOT NULL, ' +
				'nidMax INTEGER NOT NULL, ' +
				'PRIMARY KEY(id))'
			);

			txn.executeSql(
				'CREATE TABLE IF NOT EXISTS notes(' +
				'nid INTEGER NOT NULL, ' +
				'title TEXT NOT NULL, ' +
				'createDate TEXT NOT NULL, ' +
				'editDate TEXT NOT NULL, ' +
				'stageRatio INTEGER NOT NULL, ' +		// (가로 / 세로)
				'music TEXT NOT NULL, ' +
				'musicLength INTEGER NOT NULL, ' +
				'displayName INTEGER NOT NULL, ' +	// (0: did, 1: name)
				'PRIMARY KEY(nid))'
			);

			txn.executeSql(
				'CREATE TABLE IF NOT EXISTS dancers(' +
				'nid INTEGER NOT NULL, ' +
				'did INTEGER NOT NULL, ' +
				'name	TEXT NOT NULL, ' +
				'color INTEGER NOT NULL, ' +
				'PRIMARY KEY(nid, did))'
			);

			txn.executeSql(
				'CREATE TABLE IF NOT EXISTS times(' +
					'nid INTEGER NOT NULL, ' +
					'time INTEGER NOT NULL, ' +
					'duration INTEGER NOT NULL, ' +
					'PRIMARY KEY(nid, time))'
			);

			txn.executeSql(
				'CREATE TABLE IF NOT EXISTS positions(' +
					'nid INTEGER NOT NULL, ' +
					'time INTEGER NOT NULL, ' +
					'did INTEGER NOT NULL, ' +
					'x INTEGER NOT NULL, ' +
					'y INTEGER NOT NULL, ' +
					'PRIMARY KEY(nid, time, did))'
			);

			// DB 에서 note 정보 가져오기
			txn.executeSql(
				"SELECT * FROM notes",
				[],
        (txn, result) => {
					// note 정보 가져오기
					for (let i = 0; i < result.rows.length; i++)
						notes.push(result.rows.item(i));
					notes.reverse();
					this.setState({ notes });
				}
			);
		},
		e => console.log("DB ERROR", e),
		() => console.log("DB SUCCESS"));
	}

	/* Date() 로 받은 값을 YYYY.MM.DD 포멧의 string 으로 변경 */
	getTodayDate() {
		const date = new Date();
		return `${date.getFullYear()}.` +
					 `${date.getMonth() < 9 ? '0' + (date.getMonth()+1) : date.getMonth()+1}.` +
					 `${date.getDate()}. ` +
					 `${date.getHours() < 10 ? '0' + date.getHours() : date.getHours()}:` +
					 `${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`;
	}

	addNote = () => {
		const { notes } = this.state;
		// const nid = notes.length == 0 ? 0 : notes[notes.length-1].nid + 1;
		const title = 'New Note';
		const createDate = this.getTodayDate();
		const stageRatio = 2;
		const music = '';
		const musicLength = 60;
		const displayName = 0;

		db.transaction(txn => {
			txn.executeSql(
				"SELECT * FROM metadata", [],
				(txn, result) => {
					const nid = result.rows.item(0).nidMax + 1;
					const newNotes = [{ nid, title, createDate, editDate: createDate, music }, ...notes];
					this.setState({ notes: newNotes });

					txn.executeSql(
						"UPDATE metadata SET nidMax=? WHERE id=0",
						[nid]
					);
					txn.executeSql(
						"INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
						[nid, title, createDate, createDate, stageRatio, music, musicLength, displayName]
					);
				},
				e => console.log("DB ERROR", e),
				() => console.log("DB SUCCESS"));
			}
		);
	}

	updateMainStateFromDB = (nid) => {
		const { notes } = this.state;

		db.transaction(txn => {
      txn.executeSql(
				"SELECT * FROM notes WHERE nid = ?",
				[nid],
        (txn, result) => {
					const noteInfo = result.rows.item(0);
					for(let i=0; i<notes.length; i++) {
						if(notes[i].nid == nid) {
							const newNotes = [...notes.slice(0, i), noteInfo, ...notes.slice(i+1)];
							this.setState({ notes: newNotes });
						}
					}
				}
			);
		},
		e => console.log("DB ERROR", e),
		() => console.log("DB SUCCESS"));
	}


	onPressHandler = (music, nid) => {
		this.props.navigation.navigate(music == '' ? 'EditNote' : 'Formation', {
			nid: nid,
			getTodayDate: this.getTodayDate,
			updateMainStateFromDB: this.updateMainStateFromDB });
	}

	deleteNote = (nid) => {
		const { notes } = this.state;
		Alert.alert("Delete Note", "Really?",
		[{text: "No", style: 'cancel'}, {
			text: "Delete",
			onPress: () => {
				for(let i=0; i<notes.length; i++)
				if(notes[i].nid == nid) {
					const newNotes = [...notes.slice(0, i), ...notes.slice(i+1)];
					this.setState({ notes: newNotes });

					db.transaction(txn => {
						txn.executeSql("DELETE FROM notes WHERE nid=?", [nid]);
						txn.executeSql("DELETE FROM dancers WHERE nid=?", [nid]);
						txn.executeSql("DELETE FROM times WHERE nid=?", [nid]);
						txn.executeSql("DELETE FROM positions WHERE nid=?", [nid]);
					},
					e => console.log("DB ERROR", e),
					() => console.log("DB SUCCESS"));
				}
			},
		}]);
	}

	listViewItemSeparator = () => 
	<View style={getStyleSheet().itemSeparator} />

	componentDidMount() {
		this.getDatabaseData();
	}

	render() {
		const { notes } = this.state;
		const { onPressHandler, deleteNote, listViewItemSeparator } = this;
		const styles = getStyleSheet();

		return(
			// style of View: SafeArea 바깥 부분에도 배경색을 칠하기 위함
			// style of SafeAreaView: 자식들의 flex 적용을 위해 부모도 적용
			<View style={styles.bg}>
			<SafeAreaView style={styles.bg}>
				{/* Tool Bar */}
				<View style={styles.navigationBar}>
					<Text numberOfLines={1} style={styles.navigationBar__title}>Choreo Note</Text>
					<TouchableOpacity onPress={this.addNote}>
						<Text style={[styles.navigationBarText, {fontSize: 30, paddingVertical: 0}]}>+</Text>
					</TouchableOpacity>
				</View>

				{listViewItemSeparator()}

				{/* Note 리스트 */}
				<FlatList
				style={styles.noteList}
				data={notes}
				keyExtractor={(item, idx) => idx.toString()}
				ItemSeparatorComponent={listViewItemSeparator}
				renderItem={({ item, index }) =>
				<NoteItem 
				item={item}
				onPressHandler={onPressHandler}
				deleteNote={deleteNote} />
				} />

				{listViewItemSeparator()}

				<View style={[styles.navigationBar, {height: 35}]}>
					<TouchableOpacity
					onPress={() => this.props.navigation.navigate('Database')}>
						<Text style={styles.navigationBar__button}>how to use</Text>
					</TouchableOpacity>

					<TouchableOpacity
					onPress={() => this.props.navigation.navigate('Database')}>
						<Text style={styles.navigationBar__button}>setting</Text>
					</TouchableOpacity>
					{/* Footer (for debug) */}
					{/* <TouchableOpacity
					onPress={() => this.props.navigation.navigate('Database')}>
						<Text style={styles.navigationBar__button}>DB</Text>
					</TouchableOpacity> */}
				</View>
			</SafeAreaView>
			</View>
		)
	}
}