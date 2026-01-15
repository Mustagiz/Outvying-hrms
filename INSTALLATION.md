# Installation Instructions for HRMSPro

## Prerequisites

Before you begin, ensure you have the following installed on your system:
- **Node.js** (version 14.0 or higher)
- **npm** (comes with Node.js)

To check if you have Node.js and npm installed:
```bash
node --version
npm --version
```

If not installed, download from: https://nodejs.org/

## Step-by-Step Installation

### Step 1: Navigate to Project Directory
Open your terminal/command prompt and navigate to the HRMS folder:
```bash
cd C:\Users\mustagiz.OUTVYING\Documents\HRMS
```

### Step 2: Install Dependencies
Run the following command to install all required packages:
```bash
npm install
```

This will install:
- React and React DOM
- React Router DOM
- Tailwind CSS
- Lucide React (icons)
- date-fns
- All other dependencies

**Note**: Installation may take 2-5 minutes depending on your internet speed.

### Step 3: Start the Development Server
Once installation is complete, start the application:
```bash
npm start
```

The application will:
- Compile the code
- Start the development server
- Automatically open in your default browser at `http://localhost:3000`

If the browser doesn't open automatically, manually navigate to:
```
http://localhost:3000
```

### Step 4: Login
Use one of these test accounts:

**Employee Account:**
- Email: john.doe@hrmspro.com
- Password: Employee@123

**HR Manager Account:**
- Email: sarah.smith@hrmspro.com
- Password: HRManager@123

**Admin Account:**
- Email: admin@hrmspro.com
- Password: Admin@123

## Troubleshooting

### Issue: Port 3000 Already in Use
**Solution**: 
- The app will ask if you want to use a different port
- Press 'Y' to use an alternative port
- Or stop the application using port 3000

### Issue: npm install fails
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules folder
rm -rf node_modules

# Delete package-lock.json
rm package-lock.json

# Try installing again
npm install
```

### Issue: Module not found errors
**Solution**:
```bash
# Reinstall dependencies
npm install

# If still not working, try:
npm install --legacy-peer-deps
```

### Issue: Tailwind CSS not working
**Solution**:
- Make sure all files are saved
- Restart the development server (Ctrl+C, then npm start)

### Issue: Browser shows blank page
**Solution**:
- Check browser console for errors (F12)
- Clear browser cache
- Try a different browser
- Restart the development server

## Building for Production

To create a production build:
```bash
npm run build
```

This creates an optimized build in the `build` folder.

## Testing on Mobile Devices

To test on mobile devices on the same network:

1. Find your computer's IP address:
   - Windows: `ipconfig` in command prompt
   - Mac/Linux: `ifconfig` in terminal

2. On your mobile device, navigate to:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```

## Stopping the Application

To stop the development server:
- Press `Ctrl + C` in the terminal
- Type 'Y' if prompted

## Additional Commands

```bash
# Run tests
npm test

# Build for production
npm run build

# Eject from Create React App (not recommended)
npm run eject
```

## System Requirements

**Minimum:**
- 4GB RAM
- 2GB free disk space
- Modern web browser (Chrome, Firefox, Safari, Edge)

**Recommended:**
- 8GB RAM
- 5GB free disk space
- Latest version of Chrome or Firefox

## Browser Compatibility

Tested and working on:
- ✅ Google Chrome (latest)
- ✅ Mozilla Firefox (latest)
- ✅ Microsoft Edge (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## File Structure After Installation

```
HRMS/
├── node_modules/          # Installed dependencies (created after npm install)
├── public/
├── src/
├── package.json
├── package-lock.json      # Created after npm install
└── Other config files
```

## Next Steps

After successful installation:
1. ✅ Read QUICKSTART.md for a quick tour
2. ✅ Explore the application with different user roles
3. ✅ Check FEATURES.md for complete feature list
4. ✅ Review README.md for detailed documentation

## Getting Help

If you encounter any issues:
1. Check this troubleshooting section
2. Review the error message in the terminal
3. Check browser console for errors (F12)
4. Ensure all prerequisites are installed
5. Try reinstalling dependencies

## Success Indicators

You'll know the installation was successful when:
- ✅ No errors during npm install
- ✅ Development server starts without errors
- ✅ Browser opens automatically to localhost:3000
- ✅ Login page is displayed correctly
- ✅ You can login with test accounts

## Important Notes

1. **Data Persistence**: All data is stored in browser's localStorage
2. **Mock Data**: The application uses mock data (no real backend)
3. **Development Mode**: This is a development build, not optimized for production
4. **Hot Reload**: Changes to code will automatically refresh the browser

---

**Installation Complete!** 🎉

You're now ready to explore HRMSPro. Start with the QUICKSTART.md guide for a quick tour of features.
