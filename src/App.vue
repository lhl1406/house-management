<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
    <div class="w-full max-w-lg">
      <div class="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Quản Lý Máy Giặt & Sấy</h1>
          <p class="text-gray-600">Nhà Trọ Thông Minh v2.0</p>
          
          <!-- Connection Status -->
          <div class="mt-2 text-xs">
            <span v-if="isConnected" class="text-green-600">
              <i class="fas fa-wifi"></i> Đã kết nối
            </span>
            <span v-else-if="connectionError" class="text-red-600">
              <i class="fas fa-wifi"></i> {{ connectionError }}
            </span>
            <span v-else class="text-yellow-600">
              <i class="fas fa-wifi"></i> Đang kết nối...
            </span>
          </div>
        </div>

        <!-- Room Selection -->
        <div class="mb-6" v-if="!isUsingMachine">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Chọn Phòng</label>
          <select 
            v-model="selectedRoom" 
            @change="onRoomChange"
            class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors duration-300"
          >
            <option value="">-- Chọn phòng --</option>
            <option 
              v-for="room in availableRooms" 
              :key="room" 
              :value="room"
            >
              {{ room }}
            </option>
          </select>
          <div v-if="busyRooms.length > 0" class="mt-2 text-xs text-orange-600">
            <i class="fas fa-info-circle"></i>
            Phòng đang sử dụng: {{ busyRooms.join(', ') }}
          </div>
        </div>

        <!-- Phone Number -->
        <div class="mb-6" v-if="!isUsingMachine">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Số Zalo (tùy chọn)</label>
          <input 
            v-model="phoneNumber" 
            @input="validatePhoneNumber"
            type="tel" 
            placeholder="0987654321"
            maxlength="10"
            class="w-full p-3 border-2 rounded-xl focus:outline-none transition-colors duration-300"
            :class="{
              'border-gray-200 focus:border-indigo-500': !phoneNumber || isPhoneValid,
              'border-red-400 focus:border-red-500 bg-red-50': phoneNumber && !isPhoneValid
            }"
          >
          <div v-if="phoneNumber && !isPhoneValid" class="mt-1 text-xs text-red-600">
            <i class="fas fa-exclamation-triangle"></i>
            Số điện thoại phải có đúng 10 số và bắt đầu bằng 0
          </div>
          <div v-if="phoneNumber && isPhoneValid" class="mt-1 text-xs text-green-600">
            <i class="fab fa-telegram-plane"></i>
            Sẽ gửi thông báo Zalo khi hoàn thành
          </div>
        </div>

        <!-- Notes Input -->
        <div class="mb-6" v-if="!isUsingMachine && selectedRoom">
          <label class="block text-sm font-semibold text-gray-700 mb-2">Ghi chú (tùy chọn)</label>
          <textarea 
            v-model="notes" 
            placeholder="Ví dụ: Quần áo trắng, không xoắn..."
            maxlength="200"
            rows="3"
            class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors duration-300 resize-none"
          ></textarea>
          <div class="mt-1 text-xs text-gray-500">
            {{ notes.length }}/200 ký tự
          </div>
        </div>

        <!-- Update Notes Section for Current User -->
        <div class="mb-6" v-if="isUsingMachine">
          <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i class="fas fa-sticky-note text-yellow-500"></i>
              Cập Nhật Ghi Chú
            </h3>
            <textarea 
              v-model="currentNotes" 
              placeholder="Cập nhật ghi chú nếu bạn cần đi ra ngoài..."
              maxlength="200"
              rows="3"
              class="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-yellow-500 focus:outline-none transition-colors duration-300 resize-none"
            ></textarea>
            <div class="flex items-center justify-between mt-2">
              <div class="text-xs text-gray-500">
                {{ currentNotes.length }}/200 ký tự
              </div>
              <button 
                @click="updateMachineNotes"
                :disabled="isLoading || currentNotes === getCurrentMachineNotes()"
                class="px-3 py-1 bg-yellow-500 text-white rounded-lg text-xs hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <i v-if="isLoading" class="fas fa-spinner fa-spin mr-1"></i>
                <i v-else class="fas fa-save mr-1"></i>
                {{ isLoading ? 'Đang lưu...' : 'Lưu ghi chú' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Custom Time Input -->
        <div class="mb-6" v-if="!isUsingMachine && selectedRoom">
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <i class="fas fa-clock text-blue-500"></i>
              Thời Gian Tùy Chỉnh
            </h3>
            
            <!-- Time Input Grid - Responsive Layout -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <!-- Washing Time -->
              <div class="bg-blue-50/50 rounded-lg p-3">
                <label class="block text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <i class="fas fa-tint text-blue-600"></i>
                  Thời gian giặt
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <input 
                      v-model.number="customTimes.washHours" 
                      type="number" 
                      min="0" 
                      max="5"
                      placeholder="0"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center"
                    >
                    <div class="text-xs text-center text-gray-500 mt-1">Giờ</div>
                  </div>
                  <div>
                    <input 
                      v-model.number="customTimes.washMinutes" 
                      type="number" 
                      min="0" 
                      max="59"
                      placeholder="0"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center"
                    >
                    <div class="text-xs text-center text-gray-500 mt-1">Phút</div>
                  </div>
                  <div>
                    <input 
                      v-model.number="customTimes.washSeconds" 
                      type="number" 
                      min="0" 
                      max="59"
                      placeholder="0"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center"
                    >
                    <div class="text-xs text-center text-gray-500 mt-1">Giây</div>
                  </div>
                </div>
              </div>

              <!-- Drying Time -->
              <div class="bg-orange-50/50 rounded-lg p-3">
                <label class="block text-sm font-medium text-orange-700 mb-2 flex items-center gap-2">
                  <i class="fas fa-wind text-orange-600"></i>
                  Thời gian sấy
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <input 
                      v-model.number="customTimes.dryHours" 
                      type="number" 
                      min="0" 
                      max="5"
                      placeholder="0"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-center"
                    >
                    <div class="text-xs text-center text-gray-500 mt-1">Giờ</div>
                  </div>
                  <div>
                    <input 
                      v-model.number="customTimes.dryMinutes" 
                      type="number" 
                      min="0" 
                      max="59"
                      placeholder="0"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-center"
                    >
                    <div class="text-xs text-center text-gray-500 mt-1">Phút</div>
                  </div>
                  <div>
                    <input 
                      v-model.number="customTimes.drySeconds" 
                      type="number" 
                      min="0" 
                      max="59"
                      placeholder="0"
                      class="w-full p-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none text-center"
                    >
                    <div class="text-xs text-center text-gray-500 mt-1">Giây</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Total Time Display -->
            <div class="text-sm text-gray-600 bg-white/50 rounded-lg p-3">
              <div class="flex justify-between">
                <span>Tổng thời gian:</span>
                <span class="font-semibold">{{ formatTotalCustomTime() }}</span>
              </div>
            </div>

            <!-- Quick Time Presets -->
            <div class="mt-4">
              <div class="text-xs text-gray-600 mb-3">Thiết lập nhanh:</div>
              
              <!-- Responsive Presets Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <!-- Washing Machine Presets -->
                <div class="bg-blue-50/50 rounded-lg p-2">
                  <div class="text-xs text-blue-600 mb-2 font-medium flex items-center gap-1">
                    <i class="fas fa-tint"></i>
                    Máy Giặt:
                  </div>
                  <div class="flex gap-2 flex-wrap">
                    <button 
                      @click="setQuickTime('wash', 30, 0)"
                      class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                    >
                      30p
                    </button>
                    <button 
                      @click="setQuickTime('wash', 60, 0)"
                      class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                    >
                      1h
                    </button>
                    <button 
                      @click="setQuickTime('wash', 90, 0)"
                      class="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                    >
                      1h30p
                    </button>
                  </div>
                </div>
                
                <!-- Drying Machine Presets -->
                <div class="bg-orange-50/50 rounded-lg p-2">
                  <div class="text-xs text-orange-600 mb-2 font-medium flex items-center gap-1">
                    <i class="fas fa-wind"></i>
                    Máy Sấy:
                  </div>
                  <div class="flex gap-2 flex-wrap">
                    <button 
                      @click="setQuickTime('dry', 30, 0)"
                      class="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs hover:bg-orange-200 transition-colors"
                    >
                      30p
                    </button>
                    <button 
                      @click="setQuickTime('dry', 60, 0)"
                      class="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs hover:bg-orange-200 transition-colors"
                    >
                      1h
                    </button>
                    <button 
                      @click="setQuickTime('dry', 90, 0)"
                      class="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs hover:bg-orange-200 transition-colors"
                    >
                      1h30p
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Clear All Button -->
              <div class="text-center">
                <button 
                  @click="clearAllTimes"
                  class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-gray-200 transition-colors"
                >
                  <i class="fas fa-eraser mr-1"></i>
                  Xóa tất cả
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Machine Status Display -->
        <div v-if="washingMachines.some(m => m.status === 'in_use') || dryingMachines.some(m => m.status === 'in_use')" class="mb-6">
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl overflow-hidden">
            <div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2">
              <h3 class="text-sm font-semibold flex items-center gap-2">
                <i class="fas fa-cog"></i>
                Trạng Thái Máy
              </h3>
            </div>
            <div class="p-4">
              <!-- Machine Status Row - Responsive: Side by side on desktop, stacked on mobile -->
              <div class="flex flex-col sm:flex-row gap-4 mb-4">
                <!-- All Washing Machines Status -->
                <div class="bg-blue-50 rounded-lg p-3 flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <i class="fas fa-tint text-blue-600"></i>
                    <span class="font-semibold text-blue-800">Máy Giặt ({{ washingMachines.length }})</span>
                  </div>
                  <div class="space-y-2">
                    <div v-for="machine in washingMachines" :key="machine.id" class="text-sm">
                      <div class="flex items-center justify-between">
                        <span class="font-medium">{{ machine.name }}</span>
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full" :class="machine.status === 'in_use' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'"></div>
                          <span class="font-semibold text-xs">{{ machine.status === 'in_use' ? 'Đang Giặt' : 'Sẵn Sàng' }}</span>
                        </div>
                      </div>
                      <div v-if="machine.status === 'in_use'" class="text-xs text-gray-600 mt-1">
                        <!-- Find which room is using this machine -->
                        <span v-if="getRoomUsingMachine(machine.id, 'washing')">
                          Phòng: {{ getRoomUsingMachine(machine.id, 'washing').roomNumber }}
                        </span>
                        <!-- Show countdown timer for all users to see -->
                        <div v-if="getWashingCountdownForMachine(machine.id)" class="text-blue-600 font-semibold mt-1">
                          ⏱️ {{ getWashingCountdownForMachine(machine.id) }}
                        </div>
                        <!-- Show notes if available -->
                        <div v-if="getMachineNotes(machine.id)" class="text-gray-500 text-xs mt-1 italic">
                          💬 {{ getMachineNotes(machine.id) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- All Drying Machines Status -->
                <div class="bg-orange-50 rounded-lg p-3 flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <i class="fas fa-wind text-orange-600"></i>
                    <span class="font-semibold text-orange-800">Máy Sấy ({{ dryingMachines.length }})</span>
                  </div>
                  <div class="space-y-2">
                    <div v-for="machine in dryingMachines" :key="machine.id" class="text-sm">
                      <div class="flex items-center justify-between">
                        <span class="font-medium">{{ machine.name }}</span>
                        <div class="flex items-center gap-2">
                          <div class="w-2 h-2 rounded-full" :class="machine.status === 'in_use' ? 'bg-orange-500 animate-pulse' : 'bg-green-500'"></div>
                          <span class="font-semibold text-xs">{{ machine.status === 'in_use' ? 'Đang Sấy' : 'Sẵn Sàng' }}</span>
                        </div>
                      </div>
                      <div v-if="machine.status === 'in_use'" class="text-xs text-gray-600 mt-1">
                        <!-- Find which room is using this machine -->
                        <span v-if="getRoomUsingMachine(machine.id, 'drying')">
                          Phòng: {{ getRoomUsingMachine(machine.id, 'drying').roomNumber }}
                        </span>
                        <!-- Show countdown timer for all users to see -->
                        <div v-if="getDryingCountdownForMachine(machine.id)" class="text-orange-600 font-semibold mt-1">
                          ⏱️ {{ getDryingCountdownForMachine(machine.id) }}
                        </div>
                        <!-- Show notes if available -->
                        <div v-if="getMachineNotes(machine.id)" class="text-gray-500 text-xs mt-1 italic">
                          💬 {{ getMachineNotes(machine.id) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Send Zalo to machine users -->
              <div v-if="((washingUser && washingUser.phoneNumber && washingUser.roomNumber !== selectedRoom) || (dryingUser && dryingUser.phoneNumber && dryingUser.roomNumber !== selectedRoom)) && selectedRoom" class="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <i class="fab fa-telegram-plane text-green-600"></i>
                  Liên hệ qua Zalo
                </h4>
                
                <!-- Contact washing user -->
                <div v-if="washingUser && washingUser.phoneNumber && washingUser.roomNumber !== selectedRoom" class="mb-3">
                  <div class="text-xs text-blue-600 mb-2">
                    📞 Liên hệ phòng {{ washingUser.roomNumber }} (đang giặt):
                  </div>
                  <div class="flex gap-2">
                    <input 
                      :value="washingUser.phoneNumber" 
                      type="tel" 
                      readonly
                      class="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50"
                    >
                    <button 
                      @click="sendZaloToOtherRoom(washingUser.phoneNumber, 'washing', selectedRoom)"
                      class="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 whitespace-nowrap"
                    >
                      📱 Gửi Zalo
                    </button>
                  </div>
                </div>
                
                <!-- Contact drying user -->
                <div v-if="dryingUser && dryingUser.phoneNumber && dryingUser.roomNumber !== selectedRoom">
                  <div class="text-xs text-orange-600 mb-2">
                    📞 Liên hệ phòng {{ dryingUser.roomNumber }} (đang sấy):
                  </div>
                  <div class="flex gap-2">
                    <input 
                      :value="dryingUser.phoneNumber" 
                      type="tel" 
                      readonly
                      class="flex-1 p-2 border border-gray-300 rounded text-sm bg-gray-50"
                    >
                    <button 
                      @click="sendZaloToOtherRoom(dryingUser.phoneNumber, 'drying', selectedRoom)"
                      class="px-3 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 whitespace-nowrap"
                    >
                      📱 Gửi Zalo
                    </button>
                  </div>
                </div>
              </div>

              <!-- Remaining Time Display for current user -->
              <div v-if="remainingTime > 0 && isUsingMachine" class="bg-white/70 rounded-lg p-3">
                <div class="text-center">
                  <span class="text-gray-600 font-medium">Thời gian còn lại:</span>
                  <div class="text-gray-800 font-bold text-xl countdown-display countdown-timer">
                    {{ formatCountdown(remainingTime) }}
                  </div>
                  <div class="text-xs text-gray-500 mt-1">
                    {{ isUsingWashingMachine ? 'Máy Giặt' : '' }}{{ isUsingWashingMachine && isUsingDryingMachine ? ' & ' : '' }}{{ isUsingDryingMachine ? 'Máy Sấy' : '' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Machine Visualization -->
        <div class="text-center mb-8">
          <div class="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-6">
            <!-- Washing Machine -->
            <div class="text-center flex-1 w-full sm:w-auto">
              <div class="bg-blue-50 rounded-2xl p-4 mb-2">
                <i 
                  class="fas fa-circle-notch text-4xl mb-2 block transition-all duration-500"
                  :class="[
                    washingMachines.some(m => m.status === 'in_use') ? 'text-blue-500' : 'text-gray-300'
                  ]"
                ></i>
                <div class="text-sm font-medium text-gray-600 mb-1">Máy Giặt</div>
                <div v-if="washingUser" class="text-xs text-gray-500 mt-1">
                  Thời gian tạm tính:
                </div>
                <div class="text-lg font-bold countdown-display" :class="[
                  washingMachines.some(m => m.status === 'in_use') ? 'text-blue-500' : 'text-gray-400',
                  isUsingWashingMachine && washingRemainingTime > 0 ? 'countdown-timer' : ''
                ]">
                  {{ isUsingWashingMachine && washingRemainingTime > 0 ? formatCountdown(washingRemainingTime) : getWashingMachineDisplayTime() }}
                </div>
                <div class="text-xs mt-1" :class="washingMachines.some(m => m.status === 'in_use') ? 'text-blue-600' : 'text-green-600'">
                  {{ getWashingMachineStatus() }}
                </div>
                <div v-if="washingUser" class="text-xs text-gray-500 mt-1">
                  Phòng {{ washingUser.roomNumber }}
                </div>
              </div>
            </div>

            <!-- Separator - Hidden on mobile, vertical line on desktop -->
            <div class="hidden sm:block text-2xl text-gray-300 mx-4">
              <i class="fas fa-grip-lines-vertical"></i>
            </div>

            <!-- Dryer -->
            <div class="text-center flex-1 w-full sm:w-auto">
              <div class="bg-orange-50 rounded-2xl p-4 mb-2">
                <i 
                  class="fas fa-wind text-4xl mb-2 block transition-all duration-500"
                  :class="[
                    dryingMachines.some(m => m.status === 'in_use') ? 'text-orange-500 animate-pulse' : 'text-gray-300'
                  ]"
                ></i>
                <div class="text-sm font-medium text-gray-600 mb-1">Máy Sấy</div>
                <div v-if="washingUser" class="text-xs text-gray-500 mt-1">
                  Thời gian tạm tính:
                </div>
                <div class="text-lg font-bold countdown-display" :class="[
                  dryingMachines.some(m => m.status === 'in_use') ? 'text-orange-500' : 'text-gray-400',
                  isUsingDryingMachine && dryingRemainingTime > 0 ? 'countdown-timer' : ''
                ]">
                  {{ isUsingDryingMachine && dryingRemainingTime > 0 ? formatCountdown(dryingRemainingTime) : getDryingMachineDisplayTime() }}
                </div>
                <div class="text-xs mt-1" :class="dryingMachines.some(m => m.status === 'in_use') ? 'text-orange-600' : 'text-green-600'">
                  {{ getDryingMachineStatus() }}
                </div>
                <div v-if="dryingUser" class="text-xs text-gray-500 mt-1">
                  Phòng {{ dryingUser.roomNumber }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Current Status -->
          <div class="mb-4">
            <div class="text-xl font-semibold mb-2 text-gray-800">
              {{ getCurrentStatus() }}
            </div>
            
            <div v-if="selectedRoom" class="text-sm text-gray-600 mb-2">
              Phòng: <span class="font-semibold">{{ selectedRoom }}</span>
            </div>
          </div>
        </div>

        <!-- Controls -->
        <div class="flex gap-3 justify-center mb-8 flex-wrap">
          <!-- Start Washing -->
          <button
            v-if="canStartWashing"
            @click="startWashing"
            :disabled="isLoading || !hasWashTime"
            class="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm"
          >
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-tint"></i>
            {{ isLoading ? 'Đang khởi động...' : 'Bắt Đầu Giặt' }}
          </button>

          <!-- Start Drying -->
          <button
            v-if="canStartDrying"
            @click="startDrying"
            :disabled="isLoading || !hasDryTime"
            class="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm"
          >
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-wind"></i>
            {{ isLoading ? 'Đang khởi động...' : 'Bắt Đầu Sấy' }}
          </button>
          
          <div v-if="(!hasWashTime && !hasDryTime) && selectedRoom" class="text-xs text-red-600 self-center">
            Vui lòng nhập thời gian hợp lệ
          </div>

          <!-- Finish Washing -->
          <button
            v-if="isUsingWashingMachine && washingMachines.some(m => m.status === 'in_use')"
            @click="finishWashing"
            :disabled="isLoading"
            class="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm"
          >
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-stop"></i>
            {{ isLoading ? 'Đang xử lý...' : 'Hoàn Thành Giặt' }}
          </button>

          <!-- Finish Drying -->
          <button
            v-if="isUsingDryingMachine && dryingMachines.some(m => m.status === 'in_use')"
            @click="finishDrying"
            :disabled="isLoading"
            class="px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm"
          >
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-stop"></i>
            {{ isLoading ? 'Đang xử lý...' : 'Hoàn Thành Sấy' }}
          </button>

          <!-- Join Queue -->
          <button
            v-if="canJoinQueue"
            @click="joinQueue"
            :disabled="isLoading || !isPhoneValid"
            class="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-users"></i>
            {{ isLoading ? 'Đang xử lý...' : '👥 Vào Hàng Đợi' }}
          </button>

          <!-- Leave Queue -->
          <button
            v-if="isInQueue"
            @click="leaveQueue"
            :disabled="isLoading"
            class="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm"
          >
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-sign-out-alt"></i>
            {{ isLoading ? 'Đang xử lý...' : '🚪 Rời Hàng Đợi' }}
          </button>

          <!-- Debug Button -->
          <button
            @click="() => { console.log({machines: machines, roomMachineUsage: roomMachineUsage, machineCountdowns: machineCountdowns, selectedRoom: selectedRoom}) }"
            class="px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <i class="fas fa-bug"></i>
            🔍 Debug
          </button>
        </div>

        <!-- Queue Display -->
        <div v-if="queueData.queue.length > 0" class="mb-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-3 text-center">
            <i class="fas fa-users text-purple-600"></i>
            Hàng Đợi ({{ queueData.queue.length }} người)
          </h3>
          <div class="flex flex-wrap gap-2 justify-center">
            <div 
              v-for="(item, index) in queueData.queue" 
              :key="index"
              class="bg-gradient-to-r from-purple-100 to-blue-100 border-2 border-purple-300 rounded-full px-4 py-2 text-sm font-medium text-purple-800 flex items-center gap-2 shadow-sm"
              :class="{ 'border-yellow-400 bg-yellow-100': item.ipAddress === queueData.clientIP }"
            >
              <span class="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {{ index + 1 }}
              </span>
              <span>{{ item.roomNumber }}</span>
              <span v-if="item.ipAddress === queueData.clientIP" class="text-xs text-yellow-600 font-bold">(Bạn)</span>
            </div>
          </div>
        </div>

        <!-- Shared Note Section -->
        <div class="mb-8" v-if="currentMachine && currentMachine.currentNote">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-gray-800">
              <i class="fas fa-sticky-note text-yellow-500"></i>
              Ghi Chú
            </h3>
          </div>
          
          <!-- Note Display -->
          <div class="flex justify-center">
            <div class="relative">
              <div class="bg-gradient-to-br from-blue-100 via-white to-blue-50 border-2 border-blue-200 rounded-3xl p-4 shadow-lg max-w-md relative">
                <div class="text-gray-700 text-sm leading-relaxed">
                  {{ currentMachine.currentNote }}
                </div>
                <div class="absolute -bottom-2 left-6 w-4 h-4 bg-gradient-to-br from-blue-100 to-white border-r-2 border-b-2 border-blue-200 transform rotate-45"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- History -->
        <div class="bg-black/5 rounded-2xl p-5 max-h-80 overflow-y-auto custom-scrollbar">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Lịch Sử Sử Dụng</h3>
          
          <div v-if="historyData.length === 0" class="text-center text-gray-500 py-8">
            <i class="fas fa-history text-3xl mb-3"></i>
            <p>Chưa có lịch sử sử dụng</p>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="(record, index) in historyData.slice(0, 10)" 
              :key="index"
              class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="font-semibold text-gray-800">{{ record.roomNumber }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(record.startTime) }}</div>
              </div>
              <div class="text-sm text-gray-600">
                <div class="flex justify-between items-center">
                  <span>{{ record.machineType === 'washing' ? 'Máy Giặt' : 'Máy Sấy' }}:</span>
                  <span class="font-semibold">{{ formatTime(record.durationMinutes || 0) }}</span>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  {{ record.machineName }}
                </div>
              </div>
              <div v-if="record.note" class="text-xs text-gray-500 mt-2 italic">
                "{{ record.note }}"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useApiSync } from './composables/useApiSync'

export default {
  name: 'App',
  setup() {
    // API composable
    const { 
      isConnected, 
      connectionError,
      getMachines,
      getRooms,
      getHistory,
      getQueue,
      startWashing: apiStartWashing,
      finishWashing: apiFinishWashing,
      updateMachineNotes: apiUpdateMachineNotes,
      joinQueue: apiJoinQueue,
      leaveQueue: apiLeaveQueue,
      checkApiConnection
    } = useApiSync()

    // State
    const selectedRoom = ref('')
    const phoneNumber = ref('')
    const notes = ref('')
    const currentNotes = ref('') // For updating notes while using machine
    const zaloPhoneNumbers = ref({}) // For storing phone numbers to contact other rooms
    const isLoading = ref(false)
    const machines = ref([])
    const rooms = ref([])
    const historyData = ref([])
    const queueData = ref({ queue: [], clientIP: '', isInQueue: false })
    const roomMachineUsage = ref([])
    
    // Custom time inputs
    const customTimes = ref({
      washHours: 1,
      washMinutes: 0,
      washSeconds: 0,
      dryHours: 1,
      dryMinutes: 0,
      drySeconds: 0
    })

    // Countdown timer
    const remainingTime = ref(0)
    const washingRemainingTime = ref(0)
    const dryingRemainingTime = ref(0)
    const machineCountdowns = ref({}) // Store countdown for each machine by ID
    const startTime = ref(null)
    const totalDuration = ref(0)
    const isFinishing = ref(false)
    const shouldPausePolling = ref(false)
    const autoFinishTriggered = ref(false)
    
    let pollingInterval = null
    let countdownInterval = null

    // Computed properties
    const currentMachine = computed(() => machines.value[0] || null)
    
    // Separate machines for washing and drying - get available ones first
    const washingMachines = computed(() => {
      return machines.value.filter(m => m.type === 'washing')
    })
    
    const dryingMachines = computed(() => {
      return machines.value.filter(m => m.type === 'drying')
    })
    
    // Get first available washing machine
    const washingMachine = computed(() => {
      const availableWashing = washingMachines.value.find(m => m.status === 'available')
      return availableWashing || washingMachines.value[0] || null
    })
    
    // Get first available drying machine
    const dryingMachine = computed(() => {
      const availableDrying = dryingMachines.value.find(m => m.status === 'available')
      return availableDrying || dryingMachines.value[0] || null
    })
    
    // Get currently used machines for current room
    const currentRoomUsage = computed(() => {
      if (!selectedRoom.value) return []
      return roomMachineUsage.value.filter(usage => 
        usage.roomNumber === selectedRoom.value && usage.isActive
      )
    })
    
    // Check if current room is using washing machine
    const currentWashingUsage = computed(() => {
      return currentRoomUsage.value.find(usage => usage.machineType === 'washing')
    })
    
    // Check if current room is using drying machine
    const currentDryingUsage = computed(() => {
      return currentRoomUsage.value.find(usage => usage.machineType === 'drying')
    })
    
    // Machine users based on actual usage tracking
    const washingUser = computed(() => {
      const washingInUse = machines.value.find(m => m.type === 'washing' && m.status === 'in_use')
      if (!washingInUse) return null
      
      // Find the room using this washing machine
      const usage = roomMachineUsage.value.find(u => 
        u.machineId === washingInUse.id && u.isActive && u.machineType === 'washing'
      )
      if (!usage) return null
      
      return {
        roomNumber: usage.roomNumber,
        ipAddress: usage.ipAddress,
        phoneNumber: usage.phoneNumber || '',
        startTime: usage.startTime,
        estimatedEndTime: usage.estimatedEndTime
      }
    })
    
    const dryingUser = computed(() => {
      const dryingInUse = machines.value.find(m => m.type === 'drying' && m.status === 'in_use')
      if (!dryingInUse) return null
      
      // Find the room using this drying machine
      const usage = roomMachineUsage.value.find(u => 
        u.machineId === dryingInUse.id && u.isActive && u.machineType === 'drying'
      )
      if (!usage) return null
      
      return {
        roomNumber: usage.roomNumber,
        ipAddress: usage.ipAddress,
        phoneNumber: usage.phoneNumber || '',
        startTime: usage.startTime,
        estimatedEndTime: usage.estimatedEndTime
      }
    })
    
    const currentUser = computed(() => {
      return washingUser.value || dryingUser.value
    })
    
    const isUsingMachine = computed(() => {
      return currentRoomUsage.value.length > 0
    })
    
    // Separate usage checks
    const isUsingWashingMachine = computed(() => {
      return !!currentWashingUsage.value
    })
    
    const isUsingDryingMachine = computed(() => {
      return !!currentDryingUsage.value
    })
    
    // Separate availability checks
    const canUseWashingMachine = computed(() => {
      return washingMachine.value?.status === 'available'
    })
    
    const canUseDryingMachine = computed(() => {
      return dryingMachine.value?.status === 'available'
    })
    
    const availableRooms = computed(() => {
      const allRooms = ['101', '102', '103', '104', '105', '201', '202', '203', '204', '205']
      const busyRooms = roomMachineUsage.value
        .filter(usage => usage.isActive)
        .map(usage => usage.roomNumber)
      return allRooms.filter(room => !busyRooms.includes(room))
    })
    
    const busyRooms = computed(() => {
      return roomMachineUsage.value
        .filter(usage => usage.isActive)
        .map(usage => usage.roomNumber + ' - ' + (usage.machineType === 'drying' ? 'Sấy' : 'Giặt'))
    })
    
    const canStartWashing = computed(() => {
      return selectedRoom.value && canUseWashingMachine.value && !isUsingWashingMachine.value
    })
    
    const canStartDrying = computed(() => {
      return selectedRoom.value && canUseDryingMachine.value && !isUsingDryingMachine.value
    })
    
    const canJoinQueue = computed(() => {
      return selectedRoom.value && !canUseWashingMachine.value && !canUseDryingMachine.value && !isInQueue.value && !isUsingMachine.value
    })

    const isInQueue = computed(() => {
      return queueData.value.isInQueue
    })
    
    const isPhoneValid = computed(() => {
      if (!phoneNumber.value) return true
      return /^0\d{9}$/.test(phoneNumber.value)
    })

    // Custom time validation
    const hasWashTime = computed(() => {
      const washTotal = (customTimes.value.washHours || 0) * 3600 + 
                       (customTimes.value.washMinutes || 0) * 60 + 
                       (customTimes.value.washSeconds || 0)
      return washTotal > 0
    })

    const hasDryTime = computed(() => {
      const dryTotal = (customTimes.value.dryHours || 0) * 3600 + 
                      (customTimes.value.dryMinutes || 0) * 60 + 
                      (customTimes.value.drySeconds || 0)
      return dryTotal > 0
    })

    // Check if current user is using a specific machine
    const isCurrentUserUsingMachine = (machineId, machineType) => {
      if (!selectedRoom.value) return false
      
      const usage = roomMachineUsage.value.find(u => 
        u.machineId === machineId && 
        u.machineType === machineType && 
        u.roomNumber === selectedRoom.value && 
        u.isActive
      )
      
      return !!usage
    }

    // Get current machine notes for the user
    const getCurrentMachineNotes = () => {
      if (!selectedRoom.value || !isUsingMachine.value) return ''
      
      const usage = currentRoomUsage.value[0]
      return usage?.notes || ''
    }

    // Update machine notes
    const updateMachineNotes = async () => {
      if (!selectedRoom.value || !isUsingMachine.value) return
      
      isLoading.value = true
      try {
        const usage = currentRoomUsage.value[0]
        if (usage) {
          await apiUpdateMachineNotes(selectedRoom.value, usage.machineId, currentNotes.value)
          await fetchAllData()
        }
      } catch (error) {
        alert('Lỗi khi cập nhật ghi chú: ' + error.message)
      } finally {
        isLoading.value = false
      }
    }

    // Methods
    const fetchRoomMachineUsage = async () => {
      try {
        const response = await fetch('/api/room-machine-usage')
        if (!response.ok) throw new Error('Failed to fetch room machine usage')
        const data = await response.json()
        roomMachineUsage.value = data || []
      } catch (error) {
        console.error('Error fetching room machine usage:', error)
        roomMachineUsage.value = []
      }
    }

    const fetchAllData = async (skipCountdownRestart = false) => {
      try {
        if (shouldPausePolling.value) {
          console.log('⏸️ Polling paused during finish operation')
          return
        }
        
        console.log('🔄 Fetching all data...')
        
        // Fetch room machine usage first
        await fetchRoomMachineUsage()
        
        const [machineList, roomList, history, queue] = await Promise.all([
          getMachines(),
          getRooms(),
          getHistory(),
          getQueue()
        ])
        
        machines.value = machineList
        rooms.value = roomList
        historyData.value = history
        queueData.value = queue

        console.log('✅ Data fetched:', {
          machines: machineList.length,
          rooms: roomList.length,
          history: history.length,
          roomMachineUsage: roomMachineUsage.value.length
        })

        // Update current notes if user is using machine
        if (isUsingMachine.value && currentRoomUsage.value.length > 0) {
          const usage = currentRoomUsage.value[0]
          currentNotes.value = usage.notes || ''
        }

        // Start or update countdown if any machine is in use
        if (!skipCountdownRestart && !isFinishing.value) {
          const hasActiveMachine = machineList.some(m => m.status === 'in_use')
          if (hasActiveMachine) {
            if (!countdownInterval) {
              startCountdown()
            } else {
              updateCountdown()
            }
          } else {
            stopCountdown()
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    const updateCountdown = () => {
      remainingTime.value = 0
      washingRemainingTime.value = 0
      dryingRemainingTime.value = 0
      
      let hasActiveTimer = false
      let shouldTriggerFinish = false
      
      // Update countdown for ALL active machines
      const activeUsages = roomMachineUsage.value.filter(usage => usage.isActive)
      
      activeUsages.forEach(usage => {
        const start = new Date(usage.startTime).getTime()
        const estimated = new Date(usage.estimatedEndTime).getTime()
        const now = Date.now()
        const remaining = Math.max(0, Math.floor((estimated - now) / 1000))
        
        // Store countdown for this machine
        machineCountdowns.value[usage.machineId] = remaining
        
        // Update specific type countdowns
        if (usage.machineType === 'washing') {
          washingRemainingTime.value = remaining
        } else if (usage.machineType === 'drying') {
          dryingRemainingTime.value = remaining
        }
        
        // Update current user's remaining time
        if (usage.roomNumber === selectedRoom.value) {
          remainingTime.value = remaining
          totalDuration.value = Math.floor((estimated - start) / 1000)
          
          if (remaining === 0 && !autoFinishTriggered.value) {
            console.log(`🚨 ${usage.machineType.toUpperCase()} TIMER FINISHED - triggering auto-finish`)
            shouldTriggerFinish = true
          }
        }
        
        if (remaining > 0) {
          hasActiveTimer = true
        }
      })
      
      // Clean up countdowns for inactive machines
      Object.keys(machineCountdowns.value).forEach(machineId => {
        const isActive = activeUsages.some(usage => usage.machineId.toString() === machineId.toString())
        if (!isActive) {
          delete machineCountdowns.value[machineId]
        }
      })
      
      if (!hasActiveTimer) {
        startTime.value = null
        totalDuration.value = 0
        if (countdownInterval) {
          clearInterval(countdownInterval)
          countdownInterval = null
          console.log('⏹️ Countdown stopped - no active timers')
        }
      }
      
      // Trigger finish actions if needed
      if (shouldTriggerFinish && !isFinishing.value && !autoFinishTriggered.value) {
        console.log('⏰ TIME UP! Auto-triggering finish process...')
        autoFinishTriggered.value = true
        
        setTimeout(() => {
          // Check if washing machine timer is finished
          if (currentWashingUsage.value && washingRemainingTime.value === 0) {
            console.log('🧺 Auto-finishing washing for user')
            finishWashing()
          }
          // Check if drying machine timer is finished  
          else if (currentDryingUsage.value && dryingRemainingTime.value === 0) {
            console.log('🌪️ Auto-finishing drying for user')
            finishDrying()
          }
          // If no valid condition, reset the trigger
          else {
            console.log('⚠️ No valid finish condition, resetting autoFinishTriggered')
            autoFinishTriggered.value = false
          }
        }, 500)
      }
    }

    const startCountdown = () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
      
      updateCountdown()
      
      countdownInterval = setInterval(() => {
        updateCountdown()
      }, 1000)
      
      console.log('Countdown started')
    }

    const stopCountdown = () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
      remainingTime.value = 0
    }

    const startWashing = async () => {
      if (!selectedRoom.value || !washingMachine.value) return
      
      isLoading.value = true
      autoFinishTriggered.value = false
      
      try {
        const washTimeSeconds = (customTimes.value.washHours || 0) * 3600 + 
                               (customTimes.value.washMinutes || 0) * 60 + 
                               (customTimes.value.washSeconds || 0)
        
        await apiStartWashing(selectedRoom.value, washingMachine.value.id, washTimeSeconds, 0, notes.value, phoneNumber.value)
        await fetchAllData()
        startCountdown()
      } catch (error) {
        alert('Lỗi khi bắt đầu giặt: ' + error.message)
      } finally {
        isLoading.value = false
      }
    }

    const startDrying = async () => {
      if (!selectedRoom.value || !dryingMachine.value) return
      
      isLoading.value = true
      autoFinishTriggered.value = false
      
      try {
        const dryTimeSeconds = (customTimes.value.dryHours || 0) * 3600 + 
                              (customTimes.value.dryMinutes || 0) * 60 + 
                              (customTimes.value.drySeconds || 0)
        
        await apiStartWashing(selectedRoom.value, dryingMachine.value.id, 0, dryTimeSeconds, notes.value, phoneNumber.value)
        await fetchAllData()
        startCountdown()
      } catch (error) {
        alert('Lỗi khi bắt đầu sấy: ' + error.message)
      } finally {
        isLoading.value = false
      }
    }

    const finishWashing = async () => {
      if (isFinishing.value) return
      
      console.log('🛑 STARTING FINISH PROCESS')
      isLoading.value = true
      isFinishing.value = true
      shouldPausePolling.value = true
      
      try {
        console.log('Finishing washing for room:', selectedRoom.value)
        
        // Get the washing machine ID from current usage
        const machineId = currentWashingUsage.value?.machineId
        if (!machineId) {
          throw new Error('Không tìm thấy máy giặt đang sử dụng')
        }
        
        stopCountdown()
        await apiFinishWashing(selectedRoom.value, machineId)
        await new Promise(resolve => setTimeout(resolve, 1000))
        await fetchAllData(true)
        
        if (phoneNumber.value && isPhoneValid.value) {
          setTimeout(() => {
            sendZaloNotification('washing')
          }, 500)
        }
        
        console.log('✅ Washing finished successfully')
      } catch (error) {
        console.error('Error finishing washing:', error)
        alert('Lỗi khi hoàn thành giặt: ' + error.message)
      } finally {
        isLoading.value = false
        isFinishing.value = false
        shouldPausePolling.value = false
        autoFinishTriggered.value = false
        
        setTimeout(() => {
          fetchAllData(true)
        }, 2000)
      }
    }

    const finishDrying = async () => {
      if (isFinishing.value) return
      
      console.log('🛑 STARTING FINISH PROCESS')
      isLoading.value = true
      isFinishing.value = true
      shouldPausePolling.value = true
      
      try {
        console.log('Finishing drying for room:', selectedRoom.value)
        
        // Get the drying machine ID from current usage
        const machineId = currentDryingUsage.value?.machineId
        if (!machineId) {
          throw new Error('Không tìm thấy máy sấy đang sử dụng')
        }
        
        stopCountdown()
        await apiFinishWashing(selectedRoom.value, machineId)
        await new Promise(resolve => setTimeout(resolve, 1000))
        await fetchAllData(true)
        
        if (phoneNumber.value && isPhoneValid.value) {
          setTimeout(() => {
            sendZaloNotification('drying')
          }, 500)
        }
        
        console.log('✅ Drying finished successfully')
      } catch (error) {
        console.error('Error finishing drying:', error)
        alert('Lỗi khi hoàn thành sấy: ' + error.message)
      } finally {
        isLoading.value = false
        isFinishing.value = false
        shouldPausePolling.value = false
        autoFinishTriggered.value = false
        
        setTimeout(() => {
          fetchAllData(true)
        }, 2000)
      }
    }

    const joinQueue = async () => {
      if (!selectedRoom.value) return
      
      isLoading.value = true
      try {
        await apiJoinQueue(selectedRoom.value, phoneNumber.value)
        await fetchAllData()
      } catch (error) {
        alert('Lỗi khi vào hàng đợi: ' + error.message)
      } finally {
        isLoading.value = false
      }
    }

    const leaveQueue = async () => {
      isLoading.value = true
      try {
        await apiLeaveQueue()
        await fetchAllData()
      } catch (error) {
        alert('Lỗi khi rời hàng đợi: ' + error.message)
      } finally {
        isLoading.value = false
      }
    }

    const validatePhoneNumber = () => {
      // Validation is handled by computed property
    }

    const onRoomChange = () => {
      // Room selection logic
    }

    const getCurrentStatus = () => {
      if (washingMachines.value.length === 0 && dryingMachines.value.length === 0) return 'Đang tải...'
      
      const statuses = []
      
      const washingInUse = washingMachines.value.some(m => m.status === 'in_use')
      const dryingInUse = dryingMachines.value.some(m => m.status === 'in_use')
      const washingAvailable = washingMachines.value.some(m => m.status === 'available')
      const dryingAvailable = dryingMachines.value.some(m => m.status === 'available')
      
      if (washingInUse && washingAvailable) {
        statuses.push('Máy giặt: Một đang hoạt động, một sẵn sàng')
      } else if (washingInUse) {
        statuses.push('Máy giặt: Tất cả đang hoạt động')
      } else if (washingAvailable) {
        statuses.push('Máy giặt: Tất cả sẵn sàng')
      }
      
      if (dryingInUse && dryingAvailable) {
        statuses.push('Máy sấy: Một đang hoạt động, một sẵn sàng')
      } else if (dryingInUse) {
        statuses.push('Máy sấy: Tất cả đang hoạt động')
      } else if (dryingAvailable) {
        statuses.push('Máy sấy: Tất cả sẵn sàng')
      }
      
      return statuses.join(' | ') || 'Tất cả máy đang bận'
    }

    const getStatusColor = (status) => {
      switch (status) {
        case 'available': return 'bg-green-500'
        case 'in_use': return 'bg-orange-500 animate-pulse'
        default: return 'bg-gray-500'
      }
    }

    const getStatusText = (status) => {
      switch (status) {
        case 'available': return 'Sẵn Sàng'
        case 'in_use': return 'Đang Sử Dụng'
        default: return 'Không Xác Định'
      }
    }

    const formatTime = (minutes) => {
      // Handle invalid or null values
      if (!minutes || isNaN(minutes) || minutes < 0) {
        return '0m'
      }
      
      const totalMinutes = Math.round(Number(minutes))
      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60
      
      if (hours > 0) {
        return `${hours}h ${mins}m`
      }
      return `${mins}m`
    }

    const formatTimeInSeconds = (seconds) => {
      // Handle invalid or null values
      if (!seconds || isNaN(seconds) || seconds < 0) {
        return '0s'
      }
      
      const totalSeconds = Math.round(Number(seconds))
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const secs = totalSeconds % 60
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`
      } else {
        return `${secs}s`
      }
    }

    const formatCountdown = (seconds) => {
      // Handle invalid or null values
      if (!seconds || isNaN(seconds) || seconds < 0) {
        return '00:00'
      }
      
      const totalSeconds = Math.max(0, Math.round(Number(seconds)))
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const secs = totalSeconds % 60
      
      if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
    }

    const formatTotalCustomTime = () => {
      const washTotal = (customTimes.value.washHours || 0) * 3600 + 
                       (customTimes.value.washMinutes || 0) * 60 + 
                       (customTimes.value.washSeconds || 0)
      const dryTotal = (customTimes.value.dryHours || 0) * 3600 + 
                      (customTimes.value.dryMinutes || 0) * 60 + 
                      (customTimes.value.drySeconds || 0)
      
      const total = washTotal + dryTotal
      return formatTimeInSeconds(total)
    }

    const setQuickTime = (type, minutes, seconds) => {
      const totalSeconds = minutes * 60 + seconds
      const hours = Math.floor(totalSeconds / 3600)
      const mins = Math.floor((totalSeconds % 3600) / 60)
      const secs = totalSeconds % 60
      
      if (type === 'wash') {
        customTimes.value.washHours = hours
        customTimes.value.washMinutes = mins
        customTimes.value.washSeconds = secs
      } else if (type === 'dry') {
        customTimes.value.dryHours = hours
        customTimes.value.dryMinutes = mins
        customTimes.value.drySeconds = secs
      }
    }

    const clearAllTimes = () => {
      customTimes.value.washHours = 0
      customTimes.value.washMinutes = 0
      customTimes.value.washSeconds = 0
      customTimes.value.dryHours = 0
      customTimes.value.dryMinutes = 0
      customTimes.value.drySeconds = 0
    }

    const sendZaloNotification = (type = 'both') => {
      if (!phoneNumber.value || !isPhoneValid.value) {
        alert('Vui lòng nhập số điện thoại Zalo hợp lệ!')
        return
      }

      const currentTime = new Date().toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })

      let machineType = ''
      let machineIcon = ''
      let actionText = ''

      if (type === 'washing') {
        machineType = 'MÁY GIẶT'
        machineIcon = '🧺'
        actionText = 'giặt'
      } else if (type === 'drying') {
        machineType = 'MÁY SẤY'
        machineIcon = '🌪️'
        actionText = 'sấy'
      } else {
        machineType = 'MÁY GIẶT & SẤY'
        machineIcon = '🏠'
        actionText = 'giặt sấy'
      }

      const message = `🔔 THÔNG BÁO ${machineType}
${machineIcon} Phòng: ${selectedRoom.value || 'N/A'}
⏰ Thời gian: ${currentTime}
✅ Đã hoàn tất ${actionText}! Hãy lấy đồ về nhé.

📍 Nhà trọ thông minh - Hệ thống quản lý máy giặt tự động`

      const phoneNumberClean = phoneNumber.value.replace(/\D/g, '')
      const zaloUrl = `https://zalo.me/${phoneNumberClean}?message=${encodeURIComponent(message)}`

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(() => {
          console.log('Message copied to clipboard')
        }).catch(err => {
          console.error('Failed to copy message:', err)
        })
      }

      window.open(zaloUrl, '_blank')
      
      alert('✅ Đã mở Zalo để gửi thông báo!\n📋 Tin nhắn cũng đã được copy vào clipboard.')
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }

    const getRoomUsingMachine = (machineId, machineType) => {
      return roomMachineUsage.value.find(usage => 
        usage.machineId === machineId && 
        usage.machineType === machineType && 
        usage.isActive
      )
    }

    const getWashingMachineStatus = () => {
      const inUseCount = washingMachines.value.filter(m => m.status === 'in_use').length
      const totalCount = washingMachines.value.length
      
      if (inUseCount === 0) return 'Tất cả sẵn sàng'
      if (inUseCount === totalCount) return 'Tất cả đang hoạt động'
      return `${inUseCount}/${totalCount} đang hoạt động`
    }

    const getDryingMachineStatus = () => {
      const inUseCount = dryingMachines.value.filter(m => m.status === 'in_use').length
      const totalCount = dryingMachines.value.length
      
      if (inUseCount === 0) return 'Tất cả sẵn sàng'
      if (inUseCount === totalCount) return 'Tất cả đang hoạt động'
      return `${inUseCount}/${totalCount} đang hoạt động`
    }

    const getWashingMachineDisplayTime = () => {
      // If user is using washing machine and has remaining time, show that
      if (isUsingWashingMachine.value && washingRemainingTime.value > 0) {
        return formatCountdown(washingRemainingTime.value)
      }
      
      // Otherwise show total wash time set by user
      const washTotal = (customTimes.value.washHours || 0) * 3600 + 
                       (customTimes.value.washMinutes || 0) * 60 + 
                       (customTimes.value.washSeconds || 0)
      return formatTimeInSeconds(washTotal)
    }

    const getDryingMachineDisplayTime = () => {
      // If user is using drying machine and has remaining time, show that
      if (isUsingDryingMachine.value && dryingRemainingTime.value > 0) {
        return formatCountdown(dryingRemainingTime.value)
      }
      
      // Otherwise show total dry time set by user
      const dryTotal = (customTimes.value.dryHours || 0) * 3600 + 
                      (customTimes.value.dryMinutes || 0) * 60 + 
                      (customTimes.value.drySeconds || 0)
      return formatTimeInSeconds(dryTotal)
    }

    // NEW METHODS for showing countdown and notes for all rooms
    const getWashingCountdownForMachine = (machineId) => {
      const countdown = machineCountdowns.value[machineId]
      if (!countdown || countdown <= 0) return null
      
      // Verify this is a washing machine
      const usage = roomMachineUsage.value.find(u => 
        u.machineId === machineId && 
        u.machineType === 'washing' && 
        u.isActive
      )
      
      if (!usage) return null
      
      return formatCountdown(countdown)
    }

    const getDryingCountdownForMachine = (machineId) => {
      const countdown = machineCountdowns.value[machineId]
      if (!countdown || countdown <= 0) return null
      
      // Verify this is a drying machine
      const usage = roomMachineUsage.value.find(u => 
        u.machineId === machineId && 
        u.machineType === 'drying' && 
        u.isActive
      )
      
      if (!usage) return null
      
      return formatCountdown(countdown)
    }

    const getMachineNotes = (machineId) => {
      const usage = roomMachineUsage.value.find(u => 
        u.machineId === machineId && 
        u.isActive
      )
      
      return usage?.notes || null
    }

    // NEW METHOD: Send Zalo notification to another room
    const sendZaloToOtherRoom = (targetPhoneNumber, machineType, yourRoom) => {
      if (!targetPhoneNumber || !isPhoneValid.value) {
        alert('Vui lòng nhập số Zalo hợp lệ')
        return
      }

      const message = `🏠 THÔNG BÁO TỪ NHÀ TRỌ

📞 Phòng ${yourRoom} muốn liên hệ với bạn

${machineType === 'washing' ? '🫧 Về máy giặt' : '🌪️ Về máy sấy'}

💬 Vui lòng liên hệ lại để trao đổi thêm.

⏰ ${new Date().toLocaleString('vi-VN')}

📍 Nhà trọ thông minh - Hệ thống thông báo tự động`

      const phoneNumberClean = targetPhoneNumber.replace(/\D/g, '')
      const zaloUrl = `https://zalo.me/${phoneNumberClean}?message=${encodeURIComponent(message)}`

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(() => {
          console.log('Message copied to clipboard')
        }).catch(err => {
          console.error('Failed to copy message:', err)
        })
      }

      window.open(zaloUrl, '_blank')
      
      alert('✅ Đã mở Zalo để gửi thông báo!\n📋 Tin nhắn cũng đã được copy vào clipboard.')
    }

    // Lifecycle
    onMounted(async () => {
      await checkApiConnection()
      await fetchAllData()
      
      pollingInterval = setInterval(fetchAllData, 5000)
      
      const hasActiveMachine = machines.value.some(m => m.status === 'in_use')
      if (hasActiveMachine) {
        startCountdown()
      }
    })

    onUnmounted(() => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    })

    return {
      // State
      selectedRoom,
      phoneNumber,
      isLoading,
      machines,
      rooms,
      historyData,
      queueData,
      customTimes,
      remainingTime,
      washingRemainingTime,
      dryingRemainingTime,
      machineCountdowns,
      roomMachineUsage,
      
      // Computed
      currentMachine,
      washingMachine,
      dryingMachine,
      washingMachines,
      dryingMachines,
      currentUser,
      washingUser,
      dryingUser,
      isUsingMachine,
      isUsingWashingMachine,
      isUsingDryingMachine,
      canUseWashingMachine,
      canUseDryingMachine,
      availableRooms,
      busyRooms,
      canStartWashing,
      canStartDrying,
      canJoinQueue,
      isInQueue,
      isPhoneValid,
      hasWashTime,
      hasDryTime,
      currentRoomUsage,
      currentWashingUsage,
      currentDryingUsage,
      
      // API state
      isConnected,
      connectionError,
      
      // Methods
      startWashing,
      startDrying,
      finishWashing,
      finishDrying,
      joinQueue,
      leaveQueue,
      validatePhoneNumber,
      onRoomChange,
      getCurrentStatus,
      getStatusColor,
      getStatusText,
      formatTime,
      formatTimeInSeconds,
      formatCountdown,
      formatTotalCustomTime,
      setQuickTime,
      clearAllTimes,
      sendZaloNotification,
      formatDate,
      getRoomUsingMachine,
      getWashingMachineStatus,
      getDryingMachineStatus,
      getWashingMachineDisplayTime,
      getDryingMachineDisplayTime,
      getWashingCountdownForMachine,
      getDryingCountdownForMachine,
      getMachineNotes,
      sendZaloToOtherRoom,
      notes,
      currentNotes,
      zaloPhoneNumbers,
      isCurrentUserUsingMachine,
      getCurrentMachineNotes,
      updateMachineNotes
    }
  }
}
</script>

<style>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

/* Countdown timer animation */
@keyframes countdown-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.countdown-timer {
  animation: countdown-pulse 2s ease-in-out infinite;
}

/* Fast spin animation for washing machine */
@keyframes spin-fast {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-fast {
  animation: spin-fast 1s linear infinite;
}

/* Time input focus effects */
input[type="number"]:focus {
  transform: scale(1.02);
  transition: transform 0.2s ease;
}

/* Custom time input highlighting */
.time-input-active {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Quick time preset hover effects */
.quick-time-btn {
  transition: all 0.2s ease;
}

.quick-time-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .grid-cols-3 {
    gap: 1rem;
  }
  
  .quick-time-btn {
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
  }
}

/* Success/Error state indicators */
.input-success {
  border-color: #10b981;
  background-color: #f0fdf4;
}

.input-error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

/* Countdown display special styling */
.countdown-display {
  font-family: 'Courier New', monospace;
  letter-spacing: 0.1em;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Machine status animation */
.machine-active {
  position: relative;
}

.machine-active::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6, #ef4444, #f59e0b);
  border-radius: 50%;
  z-index: -1;
  animation: rotate-gradient 3s linear infinite;
}

@keyframes rotate-gradient {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>