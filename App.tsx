/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */


import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Button,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const flatListRef = useRef(null);
  const inputRef = useRef(null); // Create a reference for the TextInput

  useEffect(() => {
    fetchData();
  }, [page]);

  // Fetch data with pagination
  const fetchData = () => {
    if (loading || !hasMore) return;

    setLoading(true);
    fetch(`https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=10`)
      .then((response) => response.json())
      .then((fetchedData) => {
        if (fetchedData.length > 0) {
          setData((prevData) => [...prevData, ...fetchedData]);
        } else {
          setHasMore(false);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        Alert.alert('Error', 'Failed to fetch data.');
        setLoading(false);
      });
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    setData([]);
    fetch('https://jsonplaceholder.typicode.com/posts?_page=1&_limit=10')
      .then((response) => response.json())
      .then((fetchedData) => {
        setData(fetchedData);
        setRefreshing(false);
      })
      .catch((error) => {
        console.error(error);
        Alert.alert('Error', 'Failed to refresh data.');
        setRefreshing(false);
      });
  }, []);

  // Load more data when the user scrolls to the end
  const loadMoreData = () => {
    if (hasMore && !loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  // Handle delete
  const handleDelete = (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, {
              method: 'DELETE',
            })
              .then((response) => {
                if (response.ok) {
                  setData((prevData) => prevData.filter((item) => item.id !== id));
                  Alert.alert('Success', 'Item deleted successfully.');
                } else {
                  Alert.alert('Error', 'Failed to delete item.');
                }
              })
              .catch((error) => {
                console.error(error);
                Alert.alert('Error', 'Failed to delete item.');
              });
          },
        },
      ]
    );
  };

  // Handle post (add new item)
  const handlePost = () => {
    if (newItemName.trim() === '') {
      Alert.alert('Validation Error', 'Item name cannot be empty.');
      return;
    }

    const newItem = { title: newItemName };

    fetch('https://jsonplaceholder.typicode.com/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newItem),
    })
      .then((response) => response.json())
      .then((responseData) => {
        setData((prevData) => [responseData, ...prevData]);
        setNewItemName('');
        setModalVisible(false);
        Alert.alert('Success', 'Item added successfully.');
        flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
      })
      .catch((error) => {
        console.error(error);
        Alert.alert('Error', 'Failed to add new item.');
      });
  };

  // Render footer with loader
  const renderFooter = () => {
    return loading && hasMore ? (
      <View style={styles.footer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    ) : null;
  };

  // Handle scroll to end
  const handleScrollToEnd = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  // Handle scroll to top
  const handleScrollToTop = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
    }
  };

  // Render each item
  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.title}</Text>
      <Button title="Delete" color="#ff5c5c" onPress={() => handleDelete(item.id)} />
    </View>
  );

  // Open modal and focus on the TextInput
  const openModal = () => {
    setModalVisible(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500); // Delay to ensure modal is fully opened before focusing
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>API Integration</Text>
        <TouchableOpacity style={styles.addButton} onPress={openModal}>
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => (Math.random() * 1000).toString()}
        renderItem={renderItem}
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />

      {/* Scroll Buttons */}
      <View style={styles.scrollButtonsContainer}>
        <TouchableOpacity style={styles.scrollButton} onPress={handleScrollToTop}>
          <Text style={styles.scrollButtonText}>Top</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scrollButton} onPress={handleScrollToEnd}>
          <Text style={styles.scrollButtonText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Add Item Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setNewItemName('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Item</Text>
            <TextInput
              ref={inputRef} 
              style={styles.input}
              placeholder="Enter item name"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => { setModalVisible(false); setNewItemName(''); }} />
              <Button title="Add" onPress={handlePost} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef2f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#007bff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  addButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100, // To ensure content is above scroll buttons
  },
  itemContainer: {
    padding: 20,
    marginVertical: 6,
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // Shadow for iOS
    /*shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    // Elevation for Android
    elevation: 2,*/
  },
  itemText: {
    fontSize: 18,
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  scrollButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
  },
  scrollButton: {
    padding: 15,
    backgroundColor: '#007bff',
    marginVertical: 5,
    borderRadius: 50,
    alignItems: 'center',
    width: 60,
    height: 60,
    justifyContent: 'center',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    // Elevation for Android
    elevation: 5,
  },
  scrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default App;

