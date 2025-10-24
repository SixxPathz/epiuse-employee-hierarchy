
<div align="center">
  <img src="apps/frontend/public/logo.png" alt="EPI-USE Logo" width="120"/>
</div>

# How to Use the EPI-USE Employee Platform

## Getting In

Just go to https://epiuse-employee-hierarchy.vercel.app/ and log in with email and password.

If you want to try it out, I've set up some demo accounts:

**Admin/CEO (can do everything):**
- Email: `thabo.mthembu@epiuse.com`
- Password: `securepassword123`

**Manager (can manage their team):**
- Email: `sipho.ngcobo@epiuse.com`  
- Password: `securepassword123`

**Employee (can view stuff and update their profile):**
- Email: `kagiso.morake@epiuse.com`
- Password: `securepassword123`

**Forgot your password?** Click "Forgot Password" on the login screen and you'll get an email with a reset link.

---

## What You'll See When You Log In

The dashboard shows different stuff depending on who you are:

**If you're an Admin/CEO:**
You get the full picture - total employees, how departments are distributed, who's managing who. Plus quick buttons to add people, create managers, and export data when you need it.

![Admin Dashboard](apps/frontend/public/demo/admin%20dashboard%20example.png)

**If you're a Manager:**
You'll see your team stats - how many people report to you directly, how many report to your direct reports (indirect), and your total team size. There are also quick buttons to add employees or sub-managers to your team.

![Manager Dashboard](apps/frontend/public/demo/manager%20dashboard%20example.png)

**If you're an Employee:**
You get a nice overview of your profile info and can see the company structure. You can update your own details and browse the colleague directory to see who's who.

![Employee Dashboard](apps/frontend/public/demo/employee%20dashboard%20example.png)

---

## Managing People

### **Finding and Viewing Employees**

The employee table is pretty flexible - you can search by name, employee number, or department. Click any column header to sort by that field. You'll only see employees you're allowed to see based on your role, and if there are tons of people, it'll paginate so it doesn't get overwhelming.

![Managing Employees](apps/frontend/public/demo/Managing%20employees%20example.png)

### **Adding New Employees**

**If you're an Admin:**
Hit the "Add Employee" button and fill in all the details - name, email, employee number, position, salary, birth date. You can pick any department and assign them to any manager in that department. 

![Admin Add Employee Form](apps/frontend/public/demo/adding%20new%20employees%20as%20admin%20exmple.png)

**If you're a Manager:**
Same deal, but your department is already filled in (and locked - you can't assign people to other departments). The cool thing is you can assign the new employee to yourself OR to other managers in your department. This is handy when you're organizing your team structure.

![Manager Add Employee Form](apps/frontend/public/demo/adding%20new%20employees%20as%20manager%20exmple.png)

### **Adding Managers**

**If you're an Admin:**
Click "Add Manager" and fill in their details. You get to pick who they report to - if you select the CEO, they become a department head. If you pick another manager, they become a sub-manager under that person. The department field fills in automatically based on who you pick as their supervisor.

![Admin Add Manager Form](apps/frontend/public/demo/adding%20managers%20as%20admin%20exmple.png)

**If you're a Manager:**
You can add sub-managers under yourself by clicking "Add Sub-Manager". Their department is locked to yours (obviously), and they'll report to you. They'll get management privileges within your department, which is useful for bigger teams.

![Manager Add Sub-Manager Form](apps/frontend/public/demo/adding%20sub%20managers%20as%20manager%20exmple.png)

### **Editing People**

Click the edit icon next to anyone you're allowed to modify. The neat thing is that managers can now reassign employees to other managers within their department - so if you need to reorganize your team, you can do it without bothering an admin. Just update whatever needs changing and hit save.

![Edit Employee Modal](apps/frontend/public/demo/Editing%20people%20example.png)

### **Deleting People**

Click the delete icon if you have permission. The system won't let you delete managers who still have people reporting to them (you'd have to reassign those people first). Also can't delete the CEO if they're the only one - that would break everything. You'll get a confirmation dialog before anything gets permanently deleted.

---

## The Org Chart

This is probably my favorite part - you get a visual tree of the whole company structure. Click on anyone to see their details, and you can zoom and pan around if the organization is huge. It updates in real-time, so if someone gets promoted or moved around, you'll see it immediately.

![Organization Chart](apps/frontend/public/demo/org%20chart%20example.png)

The chart can handle however many levels of hierarchy you throw at it, and it visually groups departments so you can see how everything fits together. Different roles (admins, managers, employees) have different visual styles so you can tell who's who at a glance.



---

## Your Profile

### **Personal Stuff**

You can view and edit your profile information - name, contact details, all that. For your profile picture, it automatically pulls from Gravatar based on your email, but you can also upload your own picture if you want. If you upload something and later decide you don't like it, you can remove it and go back to the Gravatar default.

![Profile Page](apps/frontend/public/demo/personal%20stuff%20example.png)

### **Password Changes**

You can change your password anytime from the profile page. Minimum 6 characters (I kept it simple). If you're a new user with a default password, the system will make you change it before you can do anything else - basic security stuff.

---

## Data Export *(Admin)*

If you need to get employee data out of the system (for reports, backups, whatever), you can export it from the settings as CSV or JSON. CSV works great for spreadsheets, JSON is better if you're feeding it into another system.

---


## What You Can Do Based on Your Role

### **If You're an Admin/CEO**
You basically run the show - you can manage the entire organization, create/edit/delete employees anywhere, set up department heads and reporting structures. You get to see everyone's salaries, export all the data, and access the system settings. You can also assign employees to any manager in any department.


### **If You're a Manager**
You get full control within your department. The cool part is you can assign employees to yourself OR other managers in your department - gives you flexibility in organizing your team. You can create sub-managers, see comprehensive team metrics, and reassign people between managers in your department without bothering an admin. You can also export your team's data and see salaries for everyone who reports to you (directly or indirectly).


### **If You're an Employee**
You can update your own profile and password, browse the org chart to see how the company is structured, and view the colleague directory. You can see public info about your teammates but can't mess with anything important - which is probably for the best.

---

That's pretty much everything you need to know. The system is designed to be straightforward, so most things should be intuitive once you start using it. If something doesn't make sense, it's probably a bug - let me know!


