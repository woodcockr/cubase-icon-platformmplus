import { clearAllLeds } from "./icon_elements";
import { makePageWithDefaults } from "./master_controls"
import { SurfaceElements, updateDisplay } from "./icon_elements"
import { midi_cc } from "./config";
import { setTextOfColumn, setTextOfLine, makeLabel } from "./helper"

export function makePage(surfaceElements: SurfaceElements, deviceDriver: MR_DeviceDriver, midiOutput: MR_DeviceMidiOutput, midiPageOutput: MR_DeviceMidiOutput ) {
  var page = makePageWithDefaults('Midi', surfaceElements, deviceDriver, midiOutput)

  function makeMidiCCBinding(page: MR_FactoryMappingPage,displayName: string,cc: number, fader: number) {
      // ? I have no idea what page.mCustom.makeHostValueVariable actually does- all I know is I can make a value binding this way. I can't seem to be able to look it up
      // ? or access it all once made.
      page.makeValueBinding(surfaceElements.channelControls[fader].fader.mSurfaceValue, page.mCustom.makeHostValueVariable(displayName)).setValueTakeOverModeJump()
          .mOnValueChange = (function (activeDevice: MR_ActiveDevice, mapping: any, value: number, value2: any) {
              // console.log(displayName + ":" + mapping + "::" + value + "::" + value2)
              var display = JSON.parse(activeDevice.getState('display'))

              var ccValue = Math.ceil(value * 127)
              var pitchBendValue = Math.ceil(value * 16383)
              var val1 = pitchBendValue % 128
              var val2 = Math.floor(pitchBendValue / 128)

              // this is the value going back to the icon Fader
              midiOutput.sendMidi(activeDevice, [0xE0 + this.fader, val1, val2])
              // this is the value going back to Cubendo
              midiPageOutput.sendMidi(activeDevice, [0xB0, this.cc, ccValue])
              // and this updates the D2 Display
              display.row2 = setTextOfColumn(fader, makeLabel(ccValue.toString(), 6),  display.row2)
              updateDisplay(display, activeDevice, midiOutput)
          }).bind({displayName, cc, fader})
  }

    for (var i = 0; i < surfaceElements.numStrips; ++i) {
      makeMidiCCBinding(page, midi_cc[i].title, midi_cc[i].cc, i)
  }

  page.mOnActivate = function (/** @type {MR_ActiveDevice} */activeDevice) {
      console.log('from script: Platform M+ page "Midi" activated')
      clearAllLeds(activeDevice, midiOutput)

      var display = JSON.parse(activeDevice.getState('display'))
      for (var i = 0; i < surfaceElements.numStrips; ++i) {
          display.row1 = setTextOfColumn(i, makeLabel(midi_cc[i].title, 6), display.row1)
          display.row2 = setTextOfColumn(i, makeLabel("?", 6),  display.row2)
      }
      updateDisplay(display, activeDevice, midiOutput)
  }

  return page
}