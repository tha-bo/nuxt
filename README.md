http://51.21.200.150:3000/api#/
<img width="850" height="628" alt="image" src="https://github.com/user-attachments/assets/1f42667f-5edb-4278-a013-416d58d18987" />

**Q:** Given that lives depend on this software, Park Technical has insisted on a 99.99% uptime 
guarantee. What would you do to make the service more resilient? (i.e. to optimise 
uptime/high availability)?

**A:** I would advise having redundancy when it comes to infrastructure. 
Cloud services allow for geolocation redundancy for compute and for databases which can have replicas. 
NULDS load can be scaled out using event consumers. 
The api can be behind a load balancer.

**Q:** The Mainland Park, which houses the largest number of dinosaurs, wants to roll this out 
assuming the first version is a success. It’s expected that the park will house more than 1 
million dinosaurs in the next 12 months. What would you change to handle this level of scale 
on the system. Or rather, what do you expect to break, given the solution you provided? 

**A:** Based on the implementation we can rely on compute scale out for event processing. 
Primary concern would be the writes and reads to the databases. The SQL database can afford to be slower and batch process events. The realtime REDIS store while quick could suffer performance. 
If that were the case I would subdivide each location to its own grid and have a redis instance store data for a subset of locations as opposed to one instance for the whole park. One could come up with a metric for events per second and know when to scale up or scale up to meet different client requirements.

**Q:** Someone recommended that we use FireBase. Park Technical has no idea what this is, but 
has asked for your advice on whether to implement this or not. What is your 
recommendation?
**A:** Firebase is a cloud offering that streamlines development. There's less of a focus on cloud infrastructure and more of a focus on developing your solution. Platforms like Firebase are great for getting off the ground but ultimately may be limited in utility or eat into profits in the long run. Because Firebase relies on GCP it may be worthwhile to prototype some functionility but for an enterprise solution I would advise against it.
