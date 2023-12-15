import { clearAllLeds } from "./icon_elements";
import { makePageWithDefaults } from "./master_controls"
import { SurfaceElements, Helper_updateDisplay } from "./icon_elements"

export function makePage(surfaceElements: SurfaceElements, deviceDriver: MR_DeviceDriver, midiOutput: MR_DeviceMidiOutput) {
  var page = makePageWithDefaults('ChannelStrip', surfaceElements, deviceDriver, midiOutput)

  var strip = page.makeSubPageArea('Strip')
  var gatePage = strip.makeSubPage('Gate')
  var compressorPage = strip.makeSubPage('Compressor')
  var toolsPage = strip.makeSubPage('Tools')
  var saturatorPage = strip.makeSubPage('Saturator')
  var limiterPage = strip.makeSubPage('Limiter')


  var selectedTrackChannel = page.mHostAccess.mTrackSelection.mMixerChannel
  var stripEffects = selectedTrackChannel.mInsertAndStripEffects.mStripEffects

  for (var idx = 0; idx < surfaceElements.numStrips; ++idx) {
      var faderSurfaceValue = surfaceElements.channelControls[idx].fader.mSurfaceValue;

      var gate = stripEffects.mGate.mParameterBankZone.makeParameterValue()
      var compressor = stripEffects.mCompressor.mParameterBankZone.makeParameterValue()
      var tools = stripEffects.mTools.mParameterBankZone.makeParameterValue()
      var saturator = stripEffects.mSaturator.mParameterBankZone.makeParameterValue()
      var limiter = stripEffects.mLimiter.mParameterBankZone.makeParameterValue()

      for (var i = 0; i < 2; i++) { // ! Workaround for Cubase 12.0.60+ bug
          page.makeValueBinding(faderSurfaceValue, gate).setSubPage(gatePage)
          page.makeValueBinding(faderSurfaceValue, compressor).setSubPage(compressorPage)
          page.makeValueBinding(faderSurfaceValue, tools).setSubPage(toolsPage)
          page.makeValueBinding(faderSurfaceValue, saturator).setSubPage(saturatorPage)
          page.makeValueBinding(faderSurfaceValue, limiter).setSubPage(limiterPage)
      }
  }

  for (var idx = 0; idx < 5; ++idx) {
      var faderStrip = surfaceElements.channelControls[idx]
      var type = ['mGate', 'mCompressor', 'mTools', 'mSaturator', 'mLimiter'][idx]
      for (var i = 0; i < 2; i++) { // ! Workaround for Cubase 12.0.60+ bug
          page.makeValueBinding(faderStrip.rec_button.mSurfaceValue, stripEffects[type].mOn).setTypeToggle()
          page.makeValueBinding(faderStrip.mute_button.mSurfaceValue, stripEffects[type].mBypass).setTypeToggle()
      }
  }

  page.makeActionBinding(surfaceElements.channelControls[0].sel_button.mSurfaceValue, gatePage.mAction.mActivate)
  page.makeActionBinding(surfaceElements.channelControls[1].sel_button.mSurfaceValue, compressorPage.mAction.mActivate)
  page.makeActionBinding(surfaceElements.channelControls[2].sel_button.mSurfaceValue, toolsPage.mAction.mActivate)
  page.makeActionBinding(surfaceElements.channelControls[3].sel_button.mSurfaceValue, saturatorPage.mAction.mActivate)
  page.makeActionBinding(surfaceElements.channelControls[4].sel_button.mSurfaceValue, limiterPage.mAction.mActivate)

  page.mOnActivate = function (activeDevice: MR_ActiveDevice) {
      // console.log('from script: Platform M+ page "Channel Strip" activated')
      activeDevice.setState("activePage", "ChannelStrip")
      activeDevice.setState("activeSubPage", "Gate")
      clearAllLeds(activeDevice, midiOutput)
      // WIP clearChannelState(activeDevice)
      midiOutput.sendMidi(activeDevice, [0x90, 24, 127])
      midiOutput.sendMidi(activeDevice, [0x90, 25, 0])
      midiOutput.sendMidi(activeDevice, [0x90, 26, 0])
      midiOutput.sendMidi(activeDevice, [0x90, 27, 0])
      midiOutput.sendMidi(activeDevice, [0x90, 28, 0])
  }

//     page.mOnIdle = function(activeDevice, activeMapping) {
//         var now = Date.now()
//         var lastTime = Number(activeDevice.getState('lastTime'))
//         if ((now-lastTime) >= 5000) {
//             activeDevice.setState('lastTime', now.toString())
//             console.log('PAGE Default ON IDLE A')
//         } else {
// // WIP Okay so need to decide what to do here.
// // WIP And what about making MIXER a SHIFT key?
//         }
//         // Your custom idle-time tasks here
//     }

  return page
}