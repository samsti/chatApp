using System;
using System.Collections.Generic;

namespace server.Entities;

public partial class user
{
    public string id { get; set; } = null!;

    public string nickname { get; set; } = null!;

    public string salt { get; set; } = null!;

    public string hash { get; set; } = null!;

    public virtual ICollection<message> messages { get; set; } = new List<message>();

    public virtual ICollection<room> rooms { get; set; } = new List<room>();
}
