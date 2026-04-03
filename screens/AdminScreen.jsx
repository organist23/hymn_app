import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

export default function AdminScreen({ navigation, session }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset PIN State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState(null);
  const [newResetPin, setNewResetPin] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  const users = useQuery(api.users.listUsers, { adminUserId: session.userId });
  const createUserMutation = useMutation(api.users.createUser);
  const deleteUserMutation = useMutation(api.users.deleteUser);
  const resetDeviceMutation = useMutation(api.users.resetDevice);
  const resetPinMutation = useMutation(api.users.updateUserPin);

  const handleCreateUser = async () => {
    setCreateError('');

    if (!newEmail.trim()) {
      setCreateError('Email is required.');
      return;
    }

    if (!/^\d{6}$/.test(newPin)) {
      setCreateError('PIN must be exactly 6 digits.');
      return;
    }

    setIsCreating(true);
    try {
      await createUserMutation({
        email: newEmail.trim(),
        pin: newPin,
        role: newRole,
        adminUserId: session.userId,
      });

      setNewEmail('');
      setNewPin('');
      setNewRole('user');
      setShowCreateModal(false);
      Alert.alert('Success', 'User created successfully.');
    } catch (e) {
      setCreateError(e?.message || 'Failed to create user.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = (userId, email) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserMutation({
                adminUserId: session.userId,
                targetUserId: userId,
              });
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to delete user.');
            }
          },
        },
      ]
    );
  };

  const handleResetDevice = (userId, email) => {
    Alert.alert(
      'Reset Device',
      `Reset device lock for ${email}? They will be able to login on any device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              await resetDeviceMutation({
                adminUserId: session.userId,
                targetUserId: userId,
              });
              Alert.alert('Success', 'Device lock has been reset.');
            } catch (e) {
              Alert.alert('Error', e?.message || 'Failed to reset device.');
            }
          },
        },
      ]
    );
  };

  const handleResetPin = async () => {
    if (!/^\d{6}$/.test(newResetPin)) {
      setResetError('PIN must be exactly 6 digits.');
      return;
    }

    setIsResetting(true);
    try {
      await resetPinMutation({
        adminUserId: session.userId,
        targetUserId: resettingUser._id,
        newPin: newResetPin,
      });
      setShowResetModal(false);
      setNewResetPin('');
      Alert.alert('Success', `PIN for ${resettingUser.email} has been reset.`);
    } catch (e) {
      setResetError(e?.message || 'Failed to reset PIN.');
    } finally {
      setIsResetting(false);
    }
  };

  const filteredUsers = users?.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={[styles.roleBadge, item.role === 'admin' && styles.adminBadge]}>
            <Text style={[styles.roleBadgeText, item.role === 'admin' && styles.adminBadgeText]}>
              {item.role.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.userMeta}>
          {item.deviceId ? '📱 Device bound' : '⚪ No device'}
          {'  •  '}
          {item.lastLogin
            ? `Last login: ${new Date(item.lastLogin).toLocaleDateString()}`
            : 'Never logged in'}
        </Text>
      </View>
      <View style={styles.userActions}>
        {item.deviceId && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => handleResetDevice(item._id, item.email)}
          >
            <Text style={styles.resetBtnText}>Reset Device</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            setResettingUser(item);
            setResetError('');
            setShowResetModal(true);
          }}
        >
          <Text style={styles.resetBtnText}>Reset PIN</Text>
        </TouchableOpacity>
        {item._id !== session.userId && (
          <TouchableOpacity
            style={styles.deleteUserBtn}
            onPress={() => handleDeleteUser(item._id, item.email)}
          >
            <Text style={styles.deleteUserBtnText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Admin Panel</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by email or role..."
          placeholderTextColor="#636366"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearSearchBtn}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* User List */}
      {!users ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4D9FFF" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No users yet.</Text>
            </View>
          }
        />
      )}

      {/* Create User Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New User</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={(text) => { setNewEmail(text); setCreateError(''); }}
                placeholder="user@example.com"
                placeholderTextColor="#636366"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PIN (6 digits)</Text>
              <TextInput
                style={styles.input}
                value={newPin}
                onChangeText={(text) => {
                  setNewPin(text.replace(/[^0-9]/g, '').slice(0, 6));
                  setCreateError('');
                }}
                placeholder="000000"
                placeholderTextColor="#636366"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleToggle}>
                <TouchableOpacity
                  style={[styles.roleOption, newRole === 'user' && styles.roleOptionActive]}
                  onPress={() => setNewRole('user')}
                >
                  <Text style={[styles.roleOptionText, newRole === 'user' && styles.roleOptionTextActive]}>
                    User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleOption, newRole === 'admin' && styles.roleOptionActive]}
                  onPress={() => setNewRole('admin')}
                >
                  <Text style={[styles.roleOptionText, newRole === 'admin' && styles.roleOptionTextActive]}>
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {createError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{createError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowCreateModal(false);
                  setCreateError('');
                  setNewEmail('');
                  setNewPin('');
                  setNewRole('user');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, isCreating && styles.createBtnDisabled]}
                onPress={handleCreateUser}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createBtnText}>Create User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reset PIN Modal */}
      <Modal visible={showResetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset PIN</Text>
            <Text style={styles.resetSubtext}>
              Setting new 6-digit PIN for:{"\n"}
              <Text style={styles.resetUserEmail}>{resettingUser?.email}</Text>
            </Text>

            <View style={styles.inputGroup}>
              <TextInput
                style={styles.input}
                value={newResetPin}
                onChangeText={(text) => {
                  setNewResetPin(text.replace(/[^0-9]/g, '').slice(0, 6));
                  setResetError('');
                }}
                placeholder="Enter new 6-digit PIN"
                placeholderTextColor="#636366"
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            {resetError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{resetError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setShowResetModal(false);
                  setNewResetPin('');
                  setResetError('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, isResetting && styles.createBtnDisabled]}
                onPress={handleResetPin}
                disabled={isResetting}
              >
                {isResetting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createBtnText}>Save New PIN</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0f',
  },
  header: {
    backgroundColor: '#1c1c1e',
    padding: 10,
    paddingTop: 38,
    borderBottomWidth: 1,
    borderBottomColor: '#2c2c2e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  backBtnIcon: {
    fontSize: 24,
    color: '#4D9FFF',
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e5e5e7',
  },
  addButton: {
    backgroundColor: '#4D9FFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 12,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  userInfo: {
    marginBottom: 14,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e5e5e7',
    flex: 1,
  },
  roleBadge: {
    backgroundColor: '#2c2c2e',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  adminBadge: {
    backgroundColor: '#4D9FFF',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8e8e93',
    letterSpacing: 0.5,
  },
  adminBadgeText: {
    color: '#fff',
  },
  userMeta: {
    fontSize: 12,
    color: '#636366',
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  resetBtn: {
    backgroundColor: '#2c2c2e',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4D9FFF',
  },
  resetBtnText: {
    color: '#4D9FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteUserBtn: {
    backgroundColor: '#2c2c2e',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff453a',
  },
  deleteUserBtnText: {
    color: '#ff453a',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 12,
    paddingRight: 40,
    fontSize: 15,
    color: '#e5e5e7',
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 28,
    padding: 8,
  },
  clearSearchBtnText: {
    color: '#636366',
    fontSize: 16,
    fontWeight: '700',
  },
  resetSubtext: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 20,
    lineHeight: 20,
  },
  resetUserEmail: {
    color: '#e5e5e7',
    fontWeight: '700',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#2c2c2e',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#e5e5e7',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2c2c2e',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#e5e5e7',
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  roleToggle: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3c',
  },
  roleOptionActive: {
    backgroundColor: '#4D9FFF',
    borderColor: '#4D9FFF',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8e8e93',
  },
  roleOptionTextActive: {
    color: '#fff',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.3)',
  },
  errorText: {
    color: '#ff453a',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#8e8e93',
    fontSize: 15,
    fontWeight: '700',
  },
  createBtn: {
    flex: 1,
    backgroundColor: '#4D9FFF',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    color: '#636366',
    fontWeight: '600',
  },
});
