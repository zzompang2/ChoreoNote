import React from 'react';
import {
  SafeAreaView, FlatList, Text, StyleSheet, TouchableOpacity, View,
} from 'react-native';

import SQLite from "react-native-sqlite-storage";
import { COLORS } from '../values/Colors';
import { FONTS } from '../values/Fonts';

var db = SQLite.openDatabase({ name: 'ChoreoNoteDB.db' });

export default class ListScreen extends React.Component {
	constructor(props){
		super(props);
		this.state = {
      db,
      noteList: [],
		}
		this.TAG = "ListScreen/";

		db.transaction(txn => {
			txn.executeSql('DROP TABLE IF EXISTS note', []);
			txn.executeSql(
				'CREATE TABLE IF NOT EXISTS note(' +
					'id	INTEGER NOT NULL, ' +
					'title TEXT NOT NULL, ' +
					'date TEXT NOT NULL, ' +
					'music TEXT, ' +
					'PRIMARY KEY("id") );',
				[]
			);
			txn.executeSql(
				'INSERT INTO note VALUES (0, "2016 가을 정기공연", "2016.01.01", "사람들이 움직이는 게");', []
			);

			// txn.executeSql('DROP TABLE IF EXISTS dancer', []);
			// txn.executeSql('DROP TABLE IF EXISTS position', []);
			txn.executeSql(
				'CREATE TABLE IF NOT EXISTS dancer(' +
					'nid INTEGER NOT NULL, ' +
					'did INTEGER NOT NULL, ' +
					'name	TEXT, ' +
					'PRIMARY KEY(did, nid) );'
			);
			// txn.executeSql(
			// 	'INSERT INTO dancer VALUES (0, 0, "ham");'
			// );
			// txn.executeSql(
			// 	'INSERT INTO dancer VALUES (0, 1, "zzom");'
			// );
			// txn.executeSql(
			// 	'INSERT INTO dancer VALUES (0, 2, "jin");'
			// );
			// txn.executeSql(
			// 	'INSERT INTO dancer VALUES (0, 3, "gogo");'
			// );
			// txn.executeSql(
			// 	'INSERT INTO dancer VALUES (0, 4, "gogo");'
			// );
			// txn.executeSql(
			// 	'INSERT INTO dancer VALUES (0, 5, "gogo");'
			// );
			// txn.executeSql(
			// 	'INSERT INTO dancer VALUES (0, 6, "gogo");'
			// );
			txn.executeSql(
				'CREATE TABLE IF NOT EXISTS position(' +
					'nid INTEGER NOT NULL, ' +
					'did INTEGER NOT NULL, ' +
					'time INTEGER NOT NULL, ' +
					'posx INTEGER NOT NULL, ' +
					'posy INTEGER NOT NULL, ' +
					'PRIMARY KEY(nid, did, time) );'
			);
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 0, 0, 10, 10);'
			// );
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 0, 1, 20, 20);'
			// );
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 0, 5, 30, 30);'
			// );
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 1, 0, -30, -50);'
			// );
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 1, 6, -20, -40);'
			// );
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 1, 2, -10, -10);'
			// );
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 2, 0, 0, 50);'
			// );
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 3, 0, -100, -10);'
			// );
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 4, 0, -200, 0);'
			// );
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 5, 0, 300, -80);'
			// );
			// txn.executeSql(
			// 	'INSERT INTO position VALUES (0, 6, 0, -250, -10);'
			// );
		})
	}

	render() {
		console.log(this.TAG, "render");

		return(
			<SafeAreaView style={{flex: 1}}>
				<FlatList
				data={this.state.noteList}
				renderItem={({item, index}) => 
				<TouchableOpacity onPress={() => this.props.navigation.navigate('FormationScreen', {noteId: item.id})}>
					<View style={styles.rowContainer}>
						<Text numberOfLines={1} style={styles.title}>{item.title}</Text>
						<View style={styles.columnContainer}>
							<Text numberOfLines={1} style={styles.music}>{item.music}</Text>
							<Text numberOfLines={1} style={styles.date}>{item.date}</Text>
						</View>
					</View>
				</TouchableOpacity>
				}
				keyExtractor={(item, index) => item.id.toString()}
				style={styles.list}
				/>
			</SafeAreaView>
		)
	}

	componentDidMount() {
		console.log(this.TAG, "componentDidMount");
		var temp = [];

		this.state.db.transaction(txn => {
      txn.executeSql(
				"SELECT * FROM note",
        [],
        (tx, result) => {
          // console.log('length: ', result.rows.length);
					for (let i = 0; i < result.rows.length; i++) {
						console.log("item:", result.rows.item(i));
						temp.push(result.rows.item(i));
					}		
					this.setState({noteList: temp})
				}
			);
		});
	}
}

const styles = StyleSheet.create({
	list: {
		backgroundColor: COLORS.grayLight,
	},
	rowContainer: {
    flexDirection:'row',
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 15,
    marginRight: 15,
    padding: 9,
    borderBottomWidth: 0.8,
    borderBottomColor: COLORS.grayMiddle,
	},
	columnContainer: {
    flexDirection:'column',
    alignItems: 'flex-end',
	},
	title: {
    color: COLORS.blackDark, 
    fontSize:18,
		flex: 1,
		// backgroundColor: COLORS.yellow,
    //fontFamily: FONTS.binggrae2,
  },
  music: {
    color: COLORS.red, 
    fontSize:12,
    paddingLeft: 10,
    textAlign: 'right',
    //fontFamily: FONTS.binggrae2,
  },
  date: {
    color: COLORS.grayDark, 
    fontSize:12,
    paddingLeft: 10,
    //fontFamily: FONTS.binggrae2,
  },
})