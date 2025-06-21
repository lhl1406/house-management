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
        <div v-if="washingMachine || dryingMachine" class="mb-6">
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
                <!-- Washing Machine Status -->
                <div v-if="washingMachine" class="bg-blue-50 rounded-lg p-3 flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <i class="fas fa-tint text-blue-600"></i>
                    <span class="font-semibold text-blue-800">Máy Giặt</span>
                  </div>
                  <div class="text-sm">
                    <div class="mb-2">
                      <span class="text-gray-600 font-medium">Trạng thái:</span>
                      <div class="flex items-center gap-2 mt-1">
                        <div class="w-2 h-2 rounded-full" :class="washingMachine.isWashing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'"></div>
                        <span class="font-semibold">{{ washingMachine.isWashing ? 'Đang Giặt' : 'Sẵn Sàng' }}</span>
                      </div>
                    </div>
                    <div v-if="washingUser">
                      <span class="text-gray-600 font-medium">Người dùng:</span>
                      <div class="text-gray-800 font-bold">{{ washingUser.roomNumber }}</div>
                    </div>
                  </div>
                </div>
                
                <!-- Drying Machine Status -->
                <div v-if="dryingMachine" class="bg-orange-50 rounded-lg p-3 flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <i class="fas fa-wind text-orange-600"></i>
                    <span class="font-semibold text-orange-800">Máy Sấy</span>
                  </div>
                  <div class="text-sm">
                    <div class="mb-2">
                      <span class="text-gray-600 font-medium">Trạng thái:</span>
                      <div class="flex items-center gap-2 mt-1">
                        <div class="w-2 h-2 rounded-full" :class="dryingMachine.isDrying ? 'bg-orange-500 animate-pulse' : 'bg-green-500'"></div>
                        <span class="font-semibold">{{ dryingMachine.isDrying ? 'Đang Sấy' : 'Sẵn Sàng' }}</span>
                      </div>
                    </div>
                    <div v-if="dryingUser">
                      <span class="text-gray-600 font-medium">Người dùng:</span>
                      <div class="text-gray-800 font-bold">{{ dryingUser.roomNumber }}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Remaining Time Display -->
              <div v-if="remainingTime > 0" class="bg-white/70 rounded-lg p-3">
                <div class="text-center">
                  <span class="text-gray-600 font-medium">Thời gian còn lại:</span>
                  <div class="text-gray-800 font-bold text-xl countdown-display countdown-timer">
                    {{ formatCountdown(remainingTime) }}
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
                    washingMachine?.isWashing ? 'text-blue-500 animate-spin-fast' : 'text-gray-300'
                  ]"
                ></i>
                <div class="text-sm font-medium text-gray-600 mb-1">Máy Giặt</div>
                <div class="text-lg font-bold countdown-display" :class="[
                  washingMachine?.isWashing ? 'text-blue-500' : 'text-gray-400',
                  washingMachine?.isWashing && washingRemainingTime > 0 ? 'countdown-timer' : ''
                ]">
                  {{ washingMachine?.isWashing && washingRemainingTime > 0 ? formatCountdown(washingRemainingTime) : formatTimeInSeconds(washingMachine?.washTime || 0) }}
                </div>
                <div class="text-xs mt-1" :class="washingMachine?.isWashing ? 'text-blue-600' : 'text-green-600'">
                  {{ washingMachine?.isWashing ? 'Đang hoạt động' : 'Sẵn sàng' }}
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
                    dryingMachine?.isDrying ? 'text-orange-500 animate-pulse' : 'text-gray-300'
                  ]"
                ></i>
                <div class="text-sm font-medium text-gray-600 mb-1">Máy Sấy</div>
                <div class="text-lg font-bold countdown-display" :class="[
                  dryingMachine?.isDrying ? 'text-orange-500' : 'text-gray-400',
                  dryingMachine?.isDrying && dryingRemainingTime > 0 ? 'countdown-timer' : ''
                ]">
                  {{ dryingMachine?.isDrying && dryingRemainingTime > 0 ? formatCountdown(dryingRemainingTime) : formatTimeInSeconds(dryingMachine?.dryTime || 0) }}
                </div>
                <div class="text-xs mt-1" :class="dryingMachine?.isDrying ? 'text-orange-600' : 'text-green-600'">
                  {{ dryingMachine?.isDrying ? 'Đang hoạt động' : 'Sẵn sàng' }}
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
            v-if="isUsingWashingMachine && washingMachine?.isWashing"
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
            v-if="isUsingDryingMachine && dryingMachine?.isDrying"
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
            :disabled="isLoading"
            class="px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm"
          >
            <i v-if="isLoading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-users"></i>
            {{ isLoading ? 'Đang vào hàng đợi...' : 'Vào Hàng Đợi' }}
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
            {{ isLoading ? 'Đang rời...' : 'Rời Hàng Đợi' }}
          </button>

          <!-- Send Zalo Notification -->
          <button
            v-if="selectedRoom && phoneNumber && isPhoneValid"
            @click="sendZaloNotification('both')"
            class="px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <i class="fab fa-telegram-plane"></i>
            Gửi Zalo
          </button>

          <!-- Debug Button -->
          <button
            @click="debugState"
            class="px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <i class="fas fa-bug"></i>
            Debug
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
              <div class="text-sm text-gray-600 grid grid-cols-2 gap-2">
                <div>Giặt: {{ formatTime(record.washTime) }}</div>
                <div>Sấy: {{ formatTime(record.dryTime) }}</div>
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
      joinQueue: apiJoinQueue,
      leaveQueue: apiLeaveQueue,
      checkApiConnection
    } = useApiSync()

    // State
    const selectedRoom = ref('')
    const phoneNumber = ref('')
    const isLoading = ref(false)
    const machines = ref([])
    const rooms = ref([])
    const historyData = ref([])
    const queueData = ref({ queue: [], clientIP: '', isInQueue: false })
    
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
    const startTime = ref(null)
    const totalDuration = ref(0)
    
    let pollingInterval = null
    let countdownInterval = null

    // Computed properties
    const currentMachine = computed(() => machines.value[0] || null)
    
    // Separate machines for washing and drying
    const washingMachine = computed(() => {
      return machines.value.find(m => m.type === 'washing') || machines.value[0] || null
    })
    
    const dryingMachine = computed(() => {
      return machines.value.find(m => m.type === 'drying') || machines.value[1] || null
    })
    
    const currentUser = computed(() => {
      if (!currentMachine.value?.currentUserIP) return null
      return rooms.value.find(r => r.ipAddress === currentMachine.value.currentUserIP)
    })
    
    // Separate users for each machine
    const washingUser = computed(() => {
      if (!washingMachine.value) return null
      
      // Find user by machine_id first (more reliable)
      let user = rooms.value.find(r => r.machineId === washingMachine.value.id && r.isUsingMachine)
      
      // Fallback to currentUserIP if available
      if (!user && washingMachine.value.currentUserIP) {
        user = rooms.value.find(r => r.ipAddress === washingMachine.value.currentUserIP)
      }
      
      return user || null
    })
    
    const dryingUser = computed(() => {
      if (!dryingMachine.value) return null
      
      // Find user by machine_id first (more reliable)
      let user = rooms.value.find(r => r.machineId === dryingMachine.value.id && r.isUsingMachine)
      
      // Fallback to currentUserIP if available
      if (!user && dryingMachine.value.currentUserIP) {
        user = rooms.value.find(r => r.ipAddress === dryingMachine.value.currentUserIP)
      }
      
      return user || null
    })
    
    const isUsingMachine = computed(() => {
      return currentUser.value?.roomNumber === selectedRoom.value
    })
    
    // Separate usage checks
    const isUsingWashingMachine = computed(() => {
      return washingUser.value?.roomNumber === selectedRoom.value
    })
    
    const isUsingDryingMachine = computed(() => {
      return dryingUser.value?.roomNumber === selectedRoom.value
    })
    
    const canUseMachine = computed(() => {
      return currentMachine.value?.status === 'available'
    })
    
    // Separate availability checks
    const canUseWashingMachine = computed(() => {
      return washingMachine.value?.status === 'available' || !washingMachine.value?.isWashing
    })
    
    const canUseDryingMachine = computed(() => {
      return dryingMachine.value?.status === 'available' || !dryingMachine.value?.isDrying
    })
    
    const availableRooms = computed(() => {
      const allRooms = ['101', '102', '103', '104', '105', '201', '202', '203', '204', '205']
      const busyRooms = rooms.value.filter(r => r.isUsingMachine).map(r => r.roomNumber)
      return allRooms.filter(room => !busyRooms.includes(room))
    })
    
    const busyRooms = computed(() => {
      return rooms.value.filter(r => r.isUsingMachine).map(r => r.roomNumber)
    })
    
    const canStartWashing = computed(() => {
      return selectedRoom.value && canUseWashingMachine.value && !isUsingWashingMachine.value
    })
    
    const canFinishWashing = computed(() => {
      return isUsingMachine.value && currentMachine.value?.status === 'in_use'
    })
    
    const canStartDrying = computed(() => {
      return selectedRoom.value && canUseDryingMachine.value && !isUsingDryingMachine.value
    })
    
    const canJoinQueue = computed(() => {
      return selectedRoom.value && !canUseMachine.value && !isInQueue.value && !isUsingMachine.value
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

    const isValidCustomTime = computed(() => {
      return hasWashTime.value || hasDryTime.value
    })

    // Methods
    const fetchAllData = async () => {
      try {
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

        // Start or update countdown if any machine is in use
        const hasActiveMachine = machineList.some(m => m.isWashing || m.isDrying)
        if (hasActiveMachine) {
          if (!countdownInterval) {
            startCountdown()
          } else {
            updateCountdown()
          }
        } else {
          stopCountdown()
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    const updateCountdown = () => {
      // Reset all countdown timers
      remainingTime.value = 0
      washingRemainingTime.value = 0
      dryingRemainingTime.value = 0
      
      let hasActiveTimer = false
      
      // Calculate washing machine countdown
      if (washingMachine.value?.isWashing && washingUser.value) {
        const user = washingUser.value
        if (user && user.startTime) {
          const start = new Date(user.startTime).getTime()
          const now = Date.now()
          const elapsed = Math.floor((now - start) / 1000)
          const timeSeconds = washingMachine.value.washTime || 0
          
          washingRemainingTime.value = Math.max(0, timeSeconds - elapsed)
          hasActiveTimer = true
          
          // If this is the user's machine, also set general remainingTime
          if (user.roomNumber === selectedRoom.value) {
            remainingTime.value = washingRemainingTime.value
            totalDuration.value = timeSeconds
          }
          
          console.log('Washing Countdown:', {
            elapsed,
            timeSeconds,
            remaining: washingRemainingTime.value,
            user: user.roomNumber
          })
        }
      }
      
      // Calculate drying machine countdown
      if (dryingMachine.value?.isDrying && dryingUser.value) {
        const user = dryingUser.value
        if (user && user.startTime) {
          const start = new Date(user.startTime).getTime()
          const now = Date.now()
          const elapsed = Math.floor((now - start) / 1000)
          const timeSeconds = dryingMachine.value.dryTime || 0
          
          dryingRemainingTime.value = Math.max(0, timeSeconds - elapsed)
          hasActiveTimer = true
          
          // If this is the user's machine, also set general remainingTime
          if (user.roomNumber === selectedRoom.value) {
            remainingTime.value = dryingRemainingTime.value
            totalDuration.value = timeSeconds
          }
          
          console.log('Drying Countdown:', {
            elapsed,
            timeSeconds,
            remaining: dryingRemainingTime.value,
            user: user.roomNumber
          })
        }
      }
      
      // If no active timer, clear countdown
      if (!hasActiveTimer) {
        startTime.value = null
        totalDuration.value = 0
        if (countdownInterval) {
          clearInterval(countdownInterval)
          countdownInterval = null
        }
      }
    }

    const startCountdown = () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
      
      // Update countdown immediately
      updateCountdown()
      
      countdownInterval = setInterval(() => {
        updateCountdown()
        
        if (remainingTime.value <= 0) {
          console.log('Time up!')
          
          // Check if washing machine finished and user is using it
          if (washingMachine.value?.isWashing && isUsingWashingMachine.value) {
            console.log('Washing complete for user')
            finishWashing()
          }
          
          // Check if drying machine finished and user is using it
          if (dryingMachine.value?.isDrying && isUsingDryingMachine.value) {
            console.log('Drying complete for user')
            finishDrying()
          }
        }
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
      try {
        // Convert custom times to seconds
        const washTimeSeconds = (customTimes.value.washHours || 0) * 3600 + 
                               (customTimes.value.washMinutes || 0) * 60 + 
                               (customTimes.value.washSeconds || 0)
        
        // Start washing with the washing machine
        await apiStartWashing(selectedRoom.value, washingMachine.value.id, washTimeSeconds, 0, '')
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
      try {
        // Convert dry time to seconds
        const dryTimeSeconds = (customTimes.value.dryHours || 0) * 3600 + 
                              (customTimes.value.dryMinutes || 0) * 60 + 
                              (customTimes.value.drySeconds || 0)
        
        // Start drying with the drying machine
        await apiStartWashing(selectedRoom.value, dryingMachine.value.id, 0, dryTimeSeconds, '')
        await fetchAllData()
        startCountdown()
      } catch (error) {
        alert('Lỗi khi bắt đầu sấy: ' + error.message)
      } finally {
        isLoading.value = false
      }
    }

    const finishWashing = async () => {
      isLoading.value = true
      try {
        await apiFinishWashing(selectedRoom.value)
        await fetchAllData()
        stopCountdown()
        
        // Send Zalo notification if phone number is provided
        if (phoneNumber.value && isPhoneValid.value) {
          setTimeout(() => {
            sendZaloNotification('washing')
          }, 500)
        }
      } catch (error) {
        alert('Lỗi khi hoàn thành giặt: ' + error.message)
      } finally {
        isLoading.value = false
      }
    }

    const finishDrying = async () => {
      isLoading.value = true
      try {
        await apiFinishWashing(selectedRoom.value) // Use same API endpoint for now
        await fetchAllData()
        stopCountdown()
        
        // Send Zalo notification if phone number is provided
        if (phoneNumber.value && isPhoneValid.value) {
          setTimeout(() => {
            sendZaloNotification('drying')
          }, 500)
        }
      } catch (error) {
        alert('Lỗi khi hoàn thành sấy: ' + error.message)
      } finally {
        isLoading.value = false
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
      if (!washingMachine.value && !dryingMachine.value) return 'Đang tải...'
      
      const statuses = []
      
      if (washingMachine.value?.isWashing) {
        statuses.push('Máy giặt đang hoạt động')
      } else if (canUseWashingMachine.value) {
        statuses.push('Máy giặt sẵn sàng')
      }
      
      if (dryingMachine.value?.isDrying) {
        statuses.push('Máy sấy đang hoạt động')
      } else if (canUseDryingMachine.value) {
        statuses.push('Máy sấy sẵn sàng')
      }
      
      if (statuses.length === 0) return 'Cả hai máy đang bận'
      if (statuses.length === 1) return statuses[0]
      
      const runningCount = statuses.filter(s => s.includes('đang hoạt động')).length
      const readyCount = statuses.filter(s => s.includes('sẵn sàng')).length
      
      if (runningCount === 2) return 'Cả hai máy đang hoạt động'
      if (readyCount === 2) return 'Cả hai máy sẵn sàng'
      if (runningCount === 1 && readyCount === 1) return 'Một máy hoạt động, một máy sẵn sàng'
      
      return 'Trạng thái hỗn hợp'
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
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      if (hours > 0) {
        return `${hours}h ${mins}m`
      }
      return `${mins}m`
    }

    const formatTimeInSeconds = (seconds) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`
      } else {
        return `${secs}s`
      }
    }

    const formatCountdown = (seconds) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
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

      // Create Zalo message URL
      const phoneNumberClean = phoneNumber.value.replace(/\D/g, '')
      const zaloUrl = `https://zalo.me/${phoneNumberClean}?message=${encodeURIComponent(message)}`

      // Copy message to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(message).then(() => {
          console.log('Message copied to clipboard')
        }).catch(err => {
          console.error('Failed to copy message:', err)
        })
      }

      // Open Zalo
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

    const debugState = () => {
      console.log('=== DEBUG STATE ===')
      console.log('Machines:', machines.value)
      console.log('Rooms:', rooms.value)
      console.log('Queue:', queueData.value)
      console.log('Selected Room:', selectedRoom.value)
      console.log('Current Machine:', currentMachine.value)
      console.log('Current User:', currentUser.value)
      console.log('Is Using Machine:', isUsingMachine.value)
      console.log('Can Use Machine:', canUseMachine.value)
      console.log('Custom Times:', customTimes.value)
      console.log('Remaining Time:', remainingTime.value)
      console.log('=== SEPARATE MACHINES ===')
      console.log('Washing Machine:', washingMachine.value)
      console.log('Drying Machine:', dryingMachine.value)
      console.log('Washing User:', washingUser.value)
      console.log('Drying User:', dryingUser.value)
      console.log('Is Using Washing Machine:', isUsingWashingMachine.value)
      console.log('Is Using Drying Machine:', isUsingDryingMachine.value)
      
      // Debug individual machine search
      if (machines.value.length > 0) {
        console.log('=== MACHINE SEARCH DEBUG ===')
        console.log('All machines:', machines.value.map(m => ({ id: m.id, name: m.name, type: m.type })))
        console.log('Looking for washing type:', machines.value.find(m => m.type === 'washing'))
        console.log('Looking for drying type:', machines.value.find(m => m.type === 'drying'))
        console.log('Fallback index [0]:', machines.value[0])
        console.log('Fallback index [1]:', machines.value[1])
      }
      
      // Debug room-machine relationship
      if (rooms.value.length > 0) {
        console.log('=== ROOM-MACHINE RELATIONSHIP ===')
        rooms.value.forEach(room => {
          if (room.isUsingMachine) {
            console.log(`Room ${room.roomNumber}:`, {
              isUsingMachine: room.isUsingMachine,
              machineId: room.machineId,
              ipAddress: room.ipAddress,
              startTime: room.startTime
            })
          }
        })
      }
      
      alert('Debug info đã được in ra console. Mở Developer Tools (F12) để xem.')
    }

    // Lifecycle
    onMounted(async () => {
      await checkApiConnection()
      await fetchAllData()
      
      // Start polling for updates
      pollingInterval = setInterval(fetchAllData, 5000)
      
      // Start countdown if any machine is in use
      const hasActiveMachine = machines.value.some(m => m.isWashing || m.isDrying)
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
      
      // Computed
      currentMachine,
      washingMachine,
      dryingMachine,
      currentUser,
      washingUser,
      dryingUser,
      isUsingMachine,
      isUsingWashingMachine,
      isUsingDryingMachine,
      canUseMachine,
      canUseWashingMachine,
      canUseDryingMachine,
      availableRooms,
      busyRooms,
      canStartWashing,
      canFinishWashing,
      canStartDrying,
      canJoinQueue,
      isInQueue,
      isPhoneValid,
      isValidCustomTime,
      hasWashTime,
      hasDryTime,
      
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
      debugState
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