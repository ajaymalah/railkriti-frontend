import React, { useEffect, useState } from 'react';
import TextInput from '../../../text-fields/TextInput';
import { PrimaryButton } from '../../../buttons/primarybutton';
import { MdOutlineAddCircle } from 'react-icons/md';
import TimePicker from 'react-time-picker'; // Assuming you have this component installed
import 'react-time-picker/dist/TimePicker.css'; // Make sure to import the necessary CSS
import { toast } from 'react-toastify';
import conf from '@/lib/conf/conf';
import myIntercepter from '@/lib/interceptor';
import { AlertType } from '@/lib/enums/alert_type';

interface AlertEntry {
  river_name:any;
  mobile: any;
  designation: any;
  second_alert: string | number | Date;
  first_alert: any;
  device: any;
  riverName: string;
  bridgeNumber: string;
  name: string;
  mobileNumber: string;

  email: string;
  smsChecked: boolean;
  emailChecked: boolean;
  time: string[];
}

interface TimePickerProps {
  value: string;
  onChange: (value: string | null) => void;
}

const CustomTimePicker: React.FC<TimePickerProps> = ({ value, onChange }) => {
  return (
    <TimePicker
      onChange={onChange}
      value={value}
      disableClock={true}  // Disables the clock view to prevent manual input
      className="w-full text-white bg-gray-800 rounded-md"
      clearIcon={null}     // Hides the clear icon
    />
  );
};


interface AlertFormProps {
  onClose?: () => void;
  alertType: AlertType; // Replace `any` with a more specific type if available, like `AlertType`
}

const AlertForm: React.FC<AlertFormProps> = ({ onClose = () => { },alertType}) => {

  const [name, setName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [smsChecked, setSmsChecked] = useState<boolean>(true);
  const [emailChecked, setEmailChecked] = useState<boolean>(true);
  const [time, setTime] = useState<string[]>(['10:00']);
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [device_id, setDeviceId] = useState<string>('');
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await myIntercepter.get(`${conf.WIND_URL}/device`);
      const data = await response.data;
      setDevices(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching devices:', error);
      setLoading(false);
    }
  };

  const handleAddEntry = () => {
    setName('');
    setMobileNumber('');
    setEmail('');
    setSmsChecked(false);
    setEmailChecked(false);
    setTime(['10:00']);
  };

  const handleAddTimeField = () => {
    if (time.length < 2) {
      setTime([...time, '10:00']);
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...time];
    newTimes[index] = value;
    setTime(newTimes);
  };

  // Convert IST time strings to UTC Date objects
  const convertTimesToUTC = (timeStrings: string[]) => {
    return timeStrings.map(timeString => {
      const [hours, minutes] = timeString.split(':').map(Number);
      // Create a date object for today at the specified time in IST
      const date = new Date();
      date.setHours(hours, minutes, 0, 0); // Convert IST to UTC (IST is UTC+5:30)
      return date.toISOString(); // Convert to ISO string in UTC
    });
  };

  function formatTo24HourTime(date:any) {
    date = new Date(date)
    return date.toLocaleTimeString('en-GB', { // 'en-GB' is commonly used for 24-hour format
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  const handleSubmit = async () => {
    try {
      const [firstAlertTime, secondAlertTime] = convertTimesToUTC(time);

      const alertData = {
        designation: name,
        mobile: mobileNumber,
        email: email,
        first_alert: firstAlertTime || null,
        second_alert: secondAlertTime || null,
        device_uid: device_id,
        email_update: emailChecked,
        sms_update: smsChecked,
        alertType: alertType
      };

      const response = await myIntercepter.post(`${conf.NOTIFICATION}/alert`,alertData);

      if (response) {
        await fetchDevices(); // Refresh devices if necessary
        await fetchAlerts();  // Fetch updated alerts

        toast.success("Alert Added Successfully");
        console.log('Alert saved successfully');

        // Reset form fields
        resetForm();
      } else {
        toast.error('Failed to save alert');
        console.error('Failed to save alert');
      }
    } catch (error) {
      toast.error('Error submitting alert');
      console.error('Error submitting alert:', error);
    }
  };


  const resetForm = () => {

    setName('');
    setMobileNumber('');
    setEmail('');
    setSmsChecked(false);
    setEmailChecked(false);

  }
  // Function to fetch updated alerts
  const fetchAlerts = async () => {
    try {
      if (device_id) {
        const response = await myIntercepter.get(`${conf.NOTIFICATION}/alerts_by_device_uid`,{params:{
         device_uid:device_id,
         alertType: alertType
        }});
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  useEffect(() => {
    if (device_id) {
      fetchAlerts();
    }
  }, [device_id]);

  return (
    <div className="rounded-md relative pt-2">
      <div className="font-bold uppercase text-xl text-white mb-4">
        <h2>Set Alert</h2>
      </div>
      <div className='flex w-full'>
        <div className='w-full'>
          <form className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8">
            <div className={`mb-4`}>
              <label htmlFor={'device'} className="block text-white font-bold mb-2">Device<span className='text-primary'>*</span></label>
              <div className='bg-gray-800 text-white py-1 rounded-md pr-2'>
                <select
                  id={'device'}
                  name={'device'}
                  value={device_id}
                  onChange={(e) => setDeviceId(e.target.value)}
                  className="w-full border-none text-white capitalize bg-gray-800 px-2 shadow-sm"
                  required={true}
                >
                  <option value="">Device</option>
                  {devices.map(device => (
                    <option key={device.uid} className='text-white uppercase' value={device.uid}>
                      {`${device.name} (${device.location})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='flex w-full justify-between items-end h-full'>
              {time.map((t, index) => (
                <div key={index} className="flex items-center space-x-2 mb-4 text-white">
                  <div className="flex-1 text-white">
                    <CustomTimePicker
                      value={t}
                      onChange={(value) => handleTimeChange(index, value!)}
                    />
                  </div>
                  {time.length < 2 && index === time.length - 1 && (
                    <button
                      type="button"
                      className="text-2xl bg-primary w-fit h-fit p-1 rounded-md text-white text-center"
                      onClick={handleAddTimeField}
                      style={{ color: 'red' }} // Change icon color here
                    >
                      <MdOutlineAddCircle className='text-white' />
                    </button>
                  )}
                </div>
              ))}
            </div>
           
            <div></div>
            <TextInput
              label="Designation"

              value={name}
              onChange={setName}
              required
            />
            <TextInput
              label="Mobile No"

              value={mobileNumber}
              onChange={setMobileNumber}
              required
            />
            <TextInput
              label="Email"
              value={email}
              onChange={setEmail}
              required
            />
          </form>
        </div>
        <div className="flex items-center absolute right-0 top-1 justify-end">
              <label className="  text-white flex gap-x-1 items-center  mr-8 ">
                <input
                  type="checkbox"
                  checked={smsChecked}
                  onChange={(e) => setSmsChecked(e.target.checked)}
                />
                SMS
              </label>
              <label className="flex items-center gap-x-1 text-white ">
                <input
                  type="checkbox"
                  checked={emailChecked}
                  onChange={(e) => setEmailChecked(e.target.checked)}
                />
                E-mail
              </label>
            </div>
        <div>
          <div className="flex items-end px-8 lg:pb-8 h-full justify-center xl:justify-end mt-4 space-x-4 w-fit">
            <div
              className="text-2xl bg-primary hover:bg-primary/80 cursor-pointer w-fit h-fit p-1 rounded-md text-white text-center"
              onClick={handleSubmit}
              style={{ color: 'red' }} // Change icon color here
            >
              <MdOutlineAddCircle className='text-white' />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <div className="border-b  font-bold border-t border-white py-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 text-white">
          <div>Sr. No</div>
          <div>
            Designation
          </div>
          <div className=' text-center'>Mobile</div>
          <div className=' col-span-2 text-center '>Email</div>
          <div className=' text-center' >Time</div>
        </div>
        {/* <div className="h-48 overflow-y-auto no-scrollbar">
          {alerts.map((alert,index) => (
            <div key={alert.device.uid} className="border-b border-gray-600 py-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 text-white">
              <div className='capitalize ml-2'>
                {index+1}
              </div>
              <div className=' capitalize'>{alert.designation ? alert.designation : '-'}</div>
              <div className='  text-center' >{alert.mobile ? alert.mobile : '-'}</div>
              <div className=' col-span-2 '>{alert.email ? alert.email : '-'}</div>
              <div className=' flex'>
                <div>{alert.first_alert ?  formatTo24HourTime(alert.first_alert) : '-'}</div>
                <div>{alert.second_alert ? `,${ formatTo24HourTime(alert.second_alert)}` : ''}</div>
              </div>

              <div className=' flex justify-end '>
                <div className=' bg-primary p-1 w-fit h-fit  rounded-md mr-2 text-lg'>
                  <IoMdRemoveCircle/>
                </div>
              </div>
            </div>
          ))}
        </div> */}
        <div className='flex justify-end  pb-4 gap-x-8 mt-2'>
          <PrimaryButton className='w-24' onClick={() => onClose()}>
            Cancle
          </PrimaryButton>
          <PrimaryButton className='w-24' onClick={() => { resetForm(); }}>
            Reset
          </PrimaryButton>
          <PrimaryButton className='w-24' onClick={() => {
            onClose();
            window.location.reload();
          }}>
            Save
          </PrimaryButton>
        </div>

      </div>
    </div>
  );
};

export default AlertForm;
